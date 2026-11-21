<?php
include("../../../connect.php"); 
$response = array();
if(isset($_POST['distributor_user_id']) && isset($_POST['distributor_id']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$dis_id = $_POST['distributor_id'];
	
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$temp_date_v=date("m");
	if($temp_date_v > 03){
		$syeardate = date("Y");
		$syeardate_next = $syeardate+1;
		$financial_year = $syeardate."-".$syeardate_next;
		
		$syeardate_itr = date("Y")-1;
		$syeardate_next_itr = date("Y");
		
	}
	else
	{
		$syeardates = date("Y");
		$syeardate = $syeardates-1;
		$financial_year = $syeardate."-".$syeardates;
		
		$syeardate_itr = date("Y")-2;
		$syeardate_next_itr = date("Y")-1;
	}
	$select_user=mysqli_query($con,"SELECT imei_no FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_status']='1';
			$response['user_imei']=$fetch_user['imei_no'];
		}
	}
	else
	{
		$response['user_status']='0';
		$response['session_id']='';
		$response['user_imei']='';
	}
	$response['financial_year']=$financial_year;
	$tunover_query=mysqli_query($con, "select * from tbl_btcw_distributor_turnover where distributor_id='$dis_id' AND turnover>=100000000 and financial_year='$financial_year' limit 1");
	if(mysqli_num_rows($tunover_query)>0){
		while($fetch_data=mysqli_fetch_array($tunover_query))
		{
			$response['turnover']=$fetch_data['turnover'];
		}
	}
	else
	{
		$response['turnover']='0';
	}
	
	$response['only_itr_client']='No';
	$itrclient_query=mysqli_query($con, "SELECT 
            fees.distributor_id
        FROM tbl_btcw_distributor_fees AS fees 
        JOIN tbl_btcw_distributor_fees_details AS details 
            ON fees.fees_id = details.fees_id 
        WHERE fees.distributor_id = '$dis_id' 
          AND fees.distributor_fees_status != 3 
          AND details.fees_detail_status = 1 
          AND details.service_id IN (490,493,662,665)
          AND NOT EXISTS (
              SELECT 1 
              FROM tbl_btcw_distributor_fees_details d2
              JOIN tbl_btcw_distributor_fees f2 ON d2.fees_id = f2.fees_id
              WHERE f2.distributor_id = fees.distributor_id
                AND f2.distributor_fees_status != 3
                AND d2.fees_detail_status = 1
                AND d2.service_id NOT IN (490,493,662,665)
                AND f2.fees_genreation_date >= '2023-04-01'
          )");

	if(mysqli_num_rows($itrclient_query)>0)
	{
		$response['only_itr_client']='Yes';
	}
	
	$select_operator=mysqli_query($con,"select * from tbl_distributor_operator_master,tbl_circle_master,tbl_operator_master where tbl_distributor_operator_master.circle_id=tbl_circle_master.circle_id and tbl_distributor_operator_master.operator_id=tbl_operator_master.operator_id and tbl_distributor_operator_master.distributor_id='$dis_id' and tbl_operator_master.operator_name!='Digital Transfer'");
	$operator_detail=array();
	if(mysqli_num_rows($select_operator)>0)
	{
		while($fetch_operator=mysqli_fetch_array($select_operator))
		{	
			$response['operator_e_trans']='Yes';
		}
	}
	else
	{
		$response['operator_e_trans']='No';
	}
	
	$req_stockCount = mysqli_query($con,"select tbl_user_request.transaction_id from tbl_user_request,tbl_user where tbl_user_request.user_id=tbl_user.user_id and tbl_user_request.status='Pending' and tbl_user.distributor_id='$dis_id'");
	$response['request_count']=mysqli_num_rows($req_stockCount);
	
	
	$count_dsr_yes=0;
	$count_dsr_accept=0;
	
	$da  = date("Y-m-d");
	$select_fos=mysqli_query($con,"SELECT user_id,user_name,user_phone FROM tbl_user where status='Active' and distributor_id='$dis_id' order by user_id ASC");
	if(mysqli_num_rows($select_fos)>0)
	{     
		$count_total_fse=mysqli_num_rows($select_fos);
		$executive_submit=array();
		$executive_not_submit=array();
		$executive_accept=array();
		while($fetch_fos=mysqli_fetch_array($select_fos))
		{		
			$userid=$fetch_fos['user_id'];
			$select_dsr=mysqli_query($con,"SELECT * FROM tbl_dsr where user_id='$userid' and dsr_status='Pending'");
			while($fetch_dsr=mysqli_fetch_array($select_dsr))
			{
				$count_dsr_yes++;
				$executive_submit['fse_id']=$userid;
				$executive_submit['dsr_id']=$fetch_dsr['dsr_id'];
				$executive_submit['fse_name']=$fetch_fos['user_name'];
				$executive_submit['fse_phone']=$fetch_fos['user_phone'];
				$executive_submit['status']=$fetch_dsr['dsr_status'];	
				$executive_submit['total_amount']=$fetch_dsr['total_amount'];
				$executive_submit['cash_detail']=$fetch_dsr['cash_detail'];
				$executive_submit['cheque_detail']=$fetch_dsr['cheque_detail'];
				$executive_submit['dsr_date']=$fetch_dsr['date'];
				$executive_submit['dsr_time']=$fetch_dsr['time'];
				$executive_submit['submit_date']=$fetch_dsr['date'];
				$executive_submit['submit_time']=$fetch_dsr['time'];	
				$response['executive_submit'][]=$executive_submit;
			}
			$select_dsr_accept=mysqli_query($con,"SELECT * FROM tbl_dsr where user_id='$userid' and tb_insertdate='$da' and dsr_status='Accept'");
			while($fetch_dsr11=mysqli_fetch_array($select_dsr_accept))
			{
				$count_dsr_accept++;
				$executive_accept['fse_id']=$userid;
				$executive_accept['dsr_id']=$fetch_dsr11['dsr_id'];
				$executive_accept['fse_name']=$fetch_fos['user_name'];
				$executive_accept['fse_phone']=$fetch_fos['user_phone'];
				$executive_accept['status']=$fetch_dsr11['dsr_status'];	
				$executive_accept['total_amount']=$fetch_dsr11['total_amount'];
				$executive_accept['cash_detail']=$fetch_dsr11['cash_detail'];
				$executive_accept['cheque_detail']=$fetch_dsr11['cheque_detail'];
				$executive_accept['dsr_date']=$fetch_dsr11['date'];
				$executive_accept['dsr_time']=$fetch_dsr11['time'];
				$executive_accept['submit_date']=$fetch_dsr11['date'];
				$executive_accept['submit_time']=$fetch_dsr11['time'];	
				$response['executive_accept'][]=$executive_accept;
			}
		}
	}
	
	$select_slider=mysqli_query($con,"SELECT * FROM tbl_admin_slider_detail where status='Active' and Category='BTHAWK'");
	if(mysqli_num_rows($select_slider)>0)
	{     
		$slider_detail=array();
		while($fetch_product=mysqli_fetch_array($select_slider))
		{
			$slider_detail['detail_id']=$fetch_product['detail_id'];
			$slider_detail['image_path']=$fetch_product['image_path'];
			$slider_detail['text_detail']=$fetch_product['text_detail'];
			$response['slider_detail'][]=$slider_detail;
		}
	}		
	
	$select_distributor=mysqli_query($con,"SELECT next_renew_date,plan_name,distributor_category,dsr_requirement,oid,backlog_gst,distributor_gst_configure,negative_billing,lcharges_configuration,tcs_applicable_fmcg,tcs_percentage,fmcg_stock_addition,printer_model,serialno_configuration,tcs_applicable_serialno,business_type,einvoice_applicable,country,currency_value,tcs_applicable,performa_applicable FROM tbl_distributor where status='Active' and distributor_id='$dis_id'");    
	while($fetch_distributor=mysqli_fetch_array($select_distributor))
	{
		$response['renew_date']=$fetch_distributor['next_renew_date'];
		$response['current_date']=$da;
		$pname=$fetch_distributor['plan_name'];
		$response['distributor_category']=$fetch_distributor['distributor_category'];
		$response['dsr_requirement']=$fetch_distributor['dsr_requirement'];
		$response['distributor_gst_configure']=$fetch_distributor['distributor_gst_configure'];
		$response['negative_billing']=$fetch_distributor['negative_billing'];
		$response['tcs_percentage']=$fetch_distributor['tcs_percentage'];
		$response['fmcg_stock_addition']=$fetch_distributor['fmcg_stock_addition'];
		$response['business_type']=$fetch_distributor['business_type'];
		$response['einvoice_applicable']=$fetch_distributor['einvoice_applicable'];
		$response['country']=$fetch_distributor['country'];
		$response['currency_value']=$fetch_distributor['currency_value'];
		$response['performa_applicable']=$fetch_distributor['performa_applicable'];
	}
	if(isset($pname))
	{
		$payqry=mysqli_query($con,"SELECT plan_status,user_no FROM `tbl_bt_payment_plan` WHERE plan_name='$pname'");
		while($recsetpay=mysqli_fetch_array($payqry))
		{
			$plantype=$recsetpay['plan_status'];
			$userno=$recsetpay['user_no'];
		}
	}
	$freeze_status=0;
	
	$qry1=mysqli_query($con,"SELECT user_id FROM `tbl_user` where distributor_id='$dis_id' and next_renew_date=''");
	$num1=mysqli_num_rows($qry1);
	if($num1>0)
	{
		if($plantype=="OneTime")
		{	
			$qry2=mysqli_query($con,"SELECT user_id FROM `tbl_user` where distributor_id='$dis_id' and next_renew_date!=''");
			$num2=mysqli_num_rows($qry2);
			if($pname=="Standard")
			{
				if(($num2+$num1)>$userno)
					$freeze_status=1;
			}
			else if($pname=="Premium")
			{
				if(($num2+$num1)>$userno)
					$freeze_status=1;
			}
			else if($pname=="Ultimate")
			{
				if(($num2+$num1)>$userno)
					$freeze_status=1;
			}
		}
		else
		{
			$freeze_status=1;
		}	
	}
	$res_gst_status = mysqli_query($con,"select * from  tbl_digitally_invoice,tbl_distributor where tbl_digitally_invoice.AR_Code = tbl_distributor.oid and tbl_distributor.distributor_id='$dis_id' and tbl_digitally_invoice.Invoice_CN_status_by_Partner='Pending'");
	if(mysqli_num_rows($res_gst_status)>0)
	{     
		$response['turbo_invoice_count']=mysqli_num_rows($res_gst_status);
	}
	else
	{
		$response['turbo_invoice_count']=0;
	}
	
	$cdate11  = date("m");
	$cdate12  = date("Y");
	if($cdate11=="01")
	{
		$cdate12=$cdate12-1;
		$cdate11='12';
	}
	else
	{
		$cdate11=$cdate11-1;
	}
	if(strlen($cdate11)==1)
		$cdate11="0".$cdate11;
	$cdate1 = $cdate12."-".$cdate11."-01";
	$cdate2 = $cdate12."-".$cdate11."-30";
	$cdate2=date("Y-m-t", strtotime($cdate2));
	$check_gst_filling=mysqli_query($con,"select * from tbl_distributor_gst_report where distributor_id='$dis_id' and year='$cdate12' and month='$cdate11'");
	if(mysqli_num_rows($check_gst_filling)<=0) 
	{
		$response['pre_gst_filled']='No';
	}
	else
	{
		$response['pre_gst_filled']='Yes';
	}
	
	
	$total_outstanding_receive_amt=0;
	$res = mysqli_query($con,"SELECT *,sum(tbl_party_transaction.final_amt) as party_total_amt,sum(tbl_party_transaction.cash_amount) as party_received_amt FROM tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.payment_status!='Complete' and tbl_party_transaction.payment_mode='Credit' and tbl_party.distributor_id='$dis_id'");
	if(mysqli_num_rows($res)>0)
	{
		$fetch_operator=mysqli_fetch_array($res);
		$response['total_outstanding_receive_amt']=$fetch_operator['party_total_amt']-$fetch_operator['party_received_amt'];
	}
	else
	{
		$response['total_outstanding_receive_amt']=$total_outstanding_receive_amt;
	}
	
	
	$total_outstanding_payable_amt=0;
	$res_purchase = mysqli_query($con,"SELECT sum(final_net_amt) as bill_final_amt, sum(pay_amount) as paid_amt,bill_no,unique_bill,bill_date FROM tbl_distributor_transaction where payment_status!= 'Complete' and payment_mode='Credit' and distributor_id='$dis_id' group by bill_no, unique_bill order by bill_date asc");	
	if(mysqli_num_rows($res_purchase)>0)
	{
		while($fetch_product2=mysqli_fetch_assoc($res_purchase))
		{
			$res_detail = mysqli_query($con,"select disc_amt,tcs_amt,labour_charges,freight_charges, other_expenses from tbl_distributor_transaction_charges where distributor_id='$dis_id' and bill_date='".$fetch_product2['bill_date']."' AND bill_no='".$fetch_product2['bill_no']."' and unique_bill='".$fetch_product2['unique_bill']."'");
			$fetch_data=mysqli_fetch_assoc($res_detail);
												
			$total_outstanding_payable_amt=$total_outstanding_payable_amt+round($fetch_product2['bill_final_amt']-$fetch_data['disc_amt']+$fetch_data['tcs_amt']+$fetch_data['labour_charges']+$fetch_data['freight_charges']+$fetch_data['other_expenses']-$fetch_product2['paid_amt']);
		}
	}
	$response['total_outstanding_payable_amt']=$total_outstanding_payable_amt;
	
	
	$closing=mysqli_query($con,"SELECT closing_amt,date,time FROM tbl_distributor_cash_collection WHERE distributor_id='$dis_id' AND date<='$da' order by date desc limit 1");
	$fetch_closing=mysqli_fetch_array($closing);
	if(mysqli_num_rows($closing)>0)
	{
		$response['cash_in_hand']=$fetch_closing['closing_amt'];
		$response['cash_in_hand_date']=$fetch_closing['date'];
	}
	else
	{
		$response['cash_in_hand']=0;
		$response['cash_in_hand_date']='';
	}
	$final_bank_closing_amt=0;
	$select_bank_data=mysqli_query($con,"select * from tbl_distributor_bank_master where distributor_id='$dis_id' AND status= 'Active'" );
	if(mysqli_num_rows($select_bank_data)>0)
	{
		$bank_detail=array();
		while($fetch_bank=mysqli_fetch_assoc($select_bank_data))
		{
			$tamt_closing=0;
			$tamt_date=$tamt_time='';
			$bank_master_id=$fetch_bank['bank_master_id'];
			$bank_detail['bank_name']=$fetch_bank['bank_name'];
			$product_detail = mysqli_query($con, "SELECT * FROM tbl_distributor_bank_collection where date<='$da' and distributor_id='$dis_id' AND bank_id='$bank_master_id' order by date DESC limit 1");
			if(mysqli_num_rows($product_detail) > 0) 
			{
				$fetch_detail = mysqli_fetch_array($product_detail);
				$tamt_closing = $fetch_detail['closing_amt'];
				$tamt_date= $fetch_detail['date'];
				$tamt_time= $fetch_detail['time'];
			}
			$final_bank_closing_amt=$final_bank_closing_amt+$tamt_closing;
			$bank_detail['closing_amt']=$tamt_closing;
			$bank_detail['closing_date']=$tamt_date;
			$bank_detail['closing_time']=$tamt_time;
			$response['bank_detail'][]=$bank_detail;
		}
	}
	$response['final_bank_at_hand']=$final_bank_closing_amt;
	
	$expense_month  = date("Y-m-01");
	$select_expense_amt = mysqli_query($con,"select sum(final_amount) as final_expense_amt from tbl_distributor_expenses_master where insert_date>='$expense_month' and distributor_id='$dis_id' and status='Complete'");
	if(mysqli_num_rows($select_expense_amt)>0)
	{
		$fetch_closing=mysqli_fetch_array($select_expense_amt);
		if($fetch_closing['final_expense_amt']>0)
			$response['expense_amt_till_date']=$fetch_closing['final_expense_amt'];
		else
			$response['expense_amt_till_date']=0;
	}
	else
	{
		$response['expense_amt_till_date']=0;
	}
	
	$response['client_service_type']='Self Mode';
	$select_client_service = mysqli_query($con,"select * from tbl_client_service where distributor_id='$dis_id' and full_auto_bthawk='Yes'");
	if(mysqli_num_rows($select_client_service)>0)
	{
		$response['client_service_type']='Auto Mode';
	}
	
	$response['tcs_tds_percentage']=0;
	$select_tcstds = mysqli_query($con,"select * from tbl_bthawk_tcs_tds_details");
	if(mysqli_num_rows($select_tcstds)>0)
	{
		$fetch_tcstds=mysqli_fetch_array($select_tcstds);
		$response['tcs_tds_percentage']=$fetch_tcstds['value'];
	}
	
	$response['freeze_status']=$freeze_status;
	$response['dsr_submit_count']=$count_dsr_yes;
	$response['dsr_accept_count']=$count_dsr_accept;
	$response['version_no']='1.18';
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Error in Logging in, Please update App from Google Play Store and Login!!";
}	
echo json_encode($response);
?>