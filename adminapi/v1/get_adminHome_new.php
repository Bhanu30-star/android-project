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
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_imei']=$fetch_user['imei_no'];
		}
	}
	else
	{
		$response['session_id']='';
	}
	
	
	$req_stockCount = mysqli_query($con,"select tbl_user_request.transaction_id from tbl_user_request,tbl_user where tbl_user_request.user_id=tbl_user.user_id and tbl_user_request.status='Pending' and tbl_user.distributor_id='$dis_id'");
	$response['request_count']=mysqli_num_rows($req_stockCount);	
	
	
	$final_stock_amount_val=0;
	$select_product = mysqli_query($con,"select * from tbl_product where status='Active' and distributor_id='$dis_id' order by product_id ASC");
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$final_stock_amount_val=$final_stock_amount_val+($fetch_product['purchase_price']*$fetch_product['stock_quantity']);
		}
	}
	$response['final_stock_amount_val']=$final_stock_amount_val;
	
	
	$count_dsr_yes=0;
	$count_dsr_no=0;
	$count_dsr_accept=0;
	
	$da  = date("Y-m-d");
	$select_fos=mysqli_query($con,"SELECT user_id,user_name,user_phone FROM tbl_user where status='Active' and distributor_id='$dis_id' order by user_id ASC");
	if(mysqli_num_rows($select_fos)>0)
	{     
		$count_total_fse=mysqli_num_rows($select_fos);
		$response['fse_count']=$count_total_fse;
		while($fetch_fos=mysqli_fetch_array($select_fos))
		{		
			$userid=$fetch_fos['user_id'];
			$select_dsr=mysqli_query($con,"SELECT * FROM tbl_dsr where user_id='$userid' and dsr_status='Pending'");
			while($fetch_dsr=mysqli_fetch_array($select_dsr))
			{
				$count_dsr_yes++;
			}
			$select_not_dsr=mysqli_query($con,"SELECT * FROM tbl_dsr where user_id='$userid' and date='$da' and dsr_status in ('Accept','Pending')");
			if(mysqli_num_rows($select_not_dsr)<=0)
			{
				$count_dsr_no++;
					
			}
			$select_dsr_accept=mysqli_query($con,"SELECT * FROM tbl_dsr where user_id='$userid' and tb_insertdate='$da' and dsr_status='Accept'");
			while($fetch_dsr11=mysqli_fetch_array($select_dsr_accept))
			{
				$count_dsr_accept++;
			}
		}
	}
	
	$select_slider=mysqli_query($con,"SELECT * FROM tbl_admin_slider_detail where status='Active'");
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
		$response['distributor_oid']=$fetch_distributor['oid'];
		$response['backlog_gst']=$fetch_distributor['backlog_gst'];
		$response['distributor_gst_configure']=$fetch_distributor['distributor_gst_configure'];
		$response['negative_billing']=$fetch_distributor['negative_billing'];
		$response['lcharges_configuration']=$fetch_distributor['lcharges_configuration'];
		$response['tcs_applicable_fmcg']=$fetch_distributor['tcs_applicable_fmcg'];
		$response['tcs_applicable_serialno']=$fetch_distributor['tcs_applicable_serialno'];
		$response['tcs_percentage']=$fetch_distributor['tcs_percentage'];
		$response['fmcg_stock_addition']=$fetch_distributor['fmcg_stock_addition'];
		$response['printer_model']=$fetch_distributor['printer_model'];
		$response['serialno_configuration']=$fetch_distributor['serialno_configuration'];
		$response['business_type']=$fetch_distributor['business_type'];
		$response['einvoice_applicable']=$fetch_distributor['einvoice_applicable'];
		$response['country']=$fetch_distributor['country'];
		$response['currency_value']=$fetch_distributor['currency_value'];
		$response['tcs_applicable']=$fetch_distributor['tcs_applicable'];
		$response['performa_applicable']=$fetch_distributor['performa_applicable'];
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
	$tamt_date=$tamt_time='';
	$select_bank_data=mysqli_query($con,"select * from tbl_distributor_bank_master where distributor_id='$dis_id' AND status= 'Active'" );
	if(mysqli_num_rows($select_bank_data)>0)
	{
		while($fetch_bank=mysqli_fetch_assoc($select_bank_data))
		{
			$tamt_closing=0;
			
			$bank_master_id=$fetch_bank['bank_master_id'];
			$bank_detail['bank_name']=$fetch_bank['bank_name'];
			$product_detail = mysqli_query($con, "SELECT * FROM tbl_distributor_bank_collection where date<='$da' and distributor_id='$dis_id' AND bank_id='$bank_master_id' order by date DESC limit 1");
			if(mysqli_num_rows($product_detail) > 0) 
			{
				$fetch_detail = mysqli_fetch_array($product_detail);
				$tamt_closing = $fetch_detail['closing_amt'];
				$tamt_date= $fetch_detail['date'];
			}
			$final_bank_closing_amt=$final_bank_closing_amt+$tamt_closing;
		}
	}
	
	$response['closing_date']=$tamt_date;
	$response['final_bank_at_hand']=strval($final_bank_closing_amt);
	
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
	
	$response['current_date']=date("Y-m-d");
	$response['dsr_submit_count']=$count_dsr_yes;
	$response['dsr_not_submit_count']=$count_dsr_no;
	$response['dsr_accept_count']=$count_dsr_accept;

	$response['version_no']='1.0';
	$response['new_app_version']='8.0';
	$response['url']='https://bthawk.appexperts.net/apk/BTHAWK_v_24.1.apk';
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