<?php
include("../../connect.php"); 
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
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_status']='1';
			$response['user_imei']=$fetch_user['imei_no'];
			$response['session_id']=$fetch_user['session_id'];
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
	//$itrclient_query=mysqli_query($con, "SELECT fees.* FROM tbl_btcw_distributor_fees as fees, tbl_btcw_distributor_fees_details as details WHERE fees.fees_id = details.fees_id AND fees.distributor_id='$dis_id' AND fees.distributor_fees_status!=3 AND details.service_id IN (490,491,492,493,494,495,496,662,663,664,665,666,667,668) AND details.fees_detail_status=1");
	
	$itrclient_query=mysqli_query($con, "SELECT 
            fees.distributor_id
        FROM tbl_btcw_distributor_fees AS fees 
        JOIN tbl_btcw_distributor_fees_details AS details 
            ON fees.fees_id = details.fees_id 
        WHERE fees.distributor_id = '$dis_id' 
          AND fees.distributor_fees_status != 3 
          AND details.fees_detail_status = 1 
          AND details.start_year = '$syeardate_itr' 
          AND details.end_year = '$syeardate_next_itr' 
          AND details.service_id IN (490,493,662,665)
          AND NOT EXISTS (
              SELECT 1 
              FROM tbl_btcw_distributor_fees_details d2
              JOIN tbl_btcw_distributor_fees f2 ON d2.fees_id = f2.fees_id
              WHERE f2.distributor_id = fees.distributor_id
                AND f2.distributor_fees_status != 3
                AND d2.fees_detail_status = 1
                AND d2.service_id NOT IN (490,493,662,665)
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
			$operator_detail['circle_operator_id'] = $fetch_operator['circle_operator_id'];
			$operator_detail['circle_name'] = $fetch_operator['circle_name'];
			$operator_detail['operator_name'] = $fetch_operator['operator_name'];
			$operator_detail['commission_rate'] = $fetch_operator['commission_rate'];
			$operator_detail['commission_price'] = $fetch_operator['commission_price'];
			$operator_detail['sender_id'] = $fetch_operator['sender_id'];
			$response['operator_detail'][]=$operator_detail;
		}
	}
	else
	{
		$response['operator_detail']=$operator_detail;
	}

		
	$message_query=mysqli_query($con,"select * from tbl_message_position");
	$message_position=array();
	if(mysqli_num_rows($message_query)>0)
	{ 
		while($fetch_position=mysqli_fetch_array($message_query))
		{	
			$message_position['position_id'] = $fetch_position['position_id'];
			$message_position['operator'] = $fetch_position['operator'];
			$message_position['module'] = $fetch_position['module'];
			$message_position['stockFrom'] = $fetch_position['stockFrom'];
			$message_position['balance'] = $fetch_position['balance'];
			$message_position['amount'] = $fetch_position['amount'];
			$message_position['transactionId'] = $fetch_position['transactionId'];
			$message_position['adminId'] = $fetch_position['adminId'];
			$message_position['retailer_no'] = $fetch_position['retailer_no'];
			$message_position['quantity'] = $fetch_position['quantity'];
			$response['message_position'][]=$message_position;
		}
	}else{
		$response['message_position']=$message_position;
	}

	$select_bank = mysqli_query($con,"Select * from tbl_bank_sender_ids where status = 'Active'");
	$bank_sender = array();
	if(mysqli_num_rows($select_bank)>0)
	{ 
		while ($fetch_sender = mysqli_fetch_array($select_bank)) {
			$bank_sender['sender_id']=$fetch_sender['sender_id'];
			$bank_sender['sender_bank']=$fetch_sender['bank_name'];
			$response['bank_sender'][]=$bank_sender;
		}
	}else{
		$response['bank_sender']=$bank_sender;	
	}
	
	
	$req_stockCount = mysqli_query($con,"select tbl_user_request.transaction_id from tbl_user_request,tbl_user where tbl_user_request.user_id=tbl_user.user_id and tbl_user_request.status='Pending' and tbl_user.distributor_id='$dis_id'");
	$response['request_count']=mysqli_num_rows($req_stockCount);	
	
	$select_measurement=mysqli_query($con,"SELECT * FROM tbl_measurement_unit");
	if(mysqli_num_rows($select_measurement)>0)
	{     
		$product_measure=array();
		while($fetch_product=mysqli_fetch_array($select_measurement))
		{
			$product_measure['unit_id']=$fetch_product['unit_id'];
			$product_measure['unit_name']=$fetch_product['unit_name'];
			$product_measure['type']='';
			$response['product_measure'][]=$product_measure;
		}
		$res_unit = mysqli_query($con,"select * from tbl_product_unit_master where distributor_id='$dis_id' and status='Active' order by unit_name asc");  
		while($fetch_unit=mysqli_fetch_assoc($res_unit)) 
		{
			$product_measure['unit_id']=$fetch_unit['unit_id'];
			$product_measure['unit_name']=$fetch_unit['unit_name'];
			$product_measure['type']='Client';
			$response['product_measure'][]=$product_measure;
		}
	}
	$product=array();
	$select_product = mysqli_query($con,"select * from tbl_product,tbl_product_category_master,tbl_product_subcategory_master where tbl_product.category_id=tbl_product_category_master.category_id and tbl_product.subcategory_id=tbl_product_subcategory_master.subcategory_id and tbl_product.status='Active' and tbl_product.distributor_id='$dis_id' order by tbl_product.product_id ASC");
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$product['product_id']=$fetch_product['product_id'];
			$product['product_name']=$fetch_product['product_name'];
			$product['product_price']=$fetch_product['product_price'];
			$product['product_price_exc']=$fetch_product['product_price_exc'];
			$product['purchase_price']=$fetch_product['purchase_price'];
			$product['purchase_price_exc']=$fetch_product['purchase_price_exc'];
			$product['dealer_price']=$fetch_product['dealer_price'];
			$product['hsn_code']=$fetch_product['hsn_code'];
			$product['mrp']=$fetch_product['mrp_price'];
			$product['unit']=$fetch_product['unit'];
			$product['secondary_unit']=$fetch_product['secondary_unit'];
			$product['alias']=$fetch_product['alias'];
			$product['tcs_tds_applicable']=$fetch_product['tcs_tds_applicable'];
			$product['decimal_category']=$fetch_product['decimal_category'];
			$product['product_type']=$fetch_product['product_type'];
			$product['discount']=$fetch_product['discount_applicable'];
			$product['disc_percentage_amt']=$fetch_product['discount_percentage'];
			$product['disc_percentage']=$fetch_product['discount_amount'];
			$product['CGST']=$fetch_product['CGST'];
			$product['SGST']=$fetch_product['SGST'];
			$product['IGST']=$fetch_product['IGST'];
			$product['cess_app']=$fetch_product['cess_applicable'];
			$product['cess_percentage']=$fetch_product['cess_percentage'];
			$product['cess_amt']=$fetch_product['cess_pc_amt'];
			$product['product_category']=$fetch_product['product_category'];
			$product['free_stock']=$fetch_product['free_stock'];
			$product['stock_quantity']=$fetch_product['stock_quantity'];
			$product['low_stock_quantity']=$fetch_product['low_stock_quantity'];
			$product['item_type']=$fetch_product['item_type'];
			$product['maintain_inventory']=$fetch_product['maintain_inventory'];
			$product['consumable_raw_product']=$fetch_product['consumable_raw_product'];
			$product['serial_type']=$fetch_product['serial_type'];
			$product['data_type']=$fetch_product['data_type'];
			$consume_detail=array();
			$product['consume_detail']=array();
			$proidval=$fetch_product['product_id'];
			$res_consumedetail=mysqli_query($con,"SELECT * FROM tbl_product_consumable,tbl_product WHERE tbl_product_consumable.consume_product_id = tbl_product.product_id and tbl_product_consumable.product_id='$proidval' and tbl_product_consumable.status='Active'");
			if(mysqli_num_rows($res_consumedetail)>0)
			{
				while($fetch_consume=mysqli_fetch_assoc($res_consumedetail))
				{
					$consume_detail['consume_product_id']=$fetch_consume['consume_product_id'];
					$consume_detail['product_name']= $fetch_consume['product_name'];
					$consume_detail['quantity']= $fetch_consume['quantity'];
					$consume_detail['stock_quantity']=$fetch_consume['stock_quantity'];
					$product['consume_detail'][]=$consume_detail;
				}
			}
			else
			{
				$product['consume_detail']=$consume_detail;
			}
			
			$product['conversion_detail']=array();
			$conversion_detail=array();
			$res_conversiondetail=mysqli_query($con,"SELECT * FROM tbl_product_conversion_unit WHERE product_id='$proidval' and status='Active'");
			if(mysqli_num_rows($res_conversiondetail)>0)
			{
				while($fetch_consume=mysqli_fetch_assoc($res_conversiondetail))
				{
					$conversion_detail['detail_id']=$fetch_consume['detail_id'];
					$conversion_detail['conversion_detail']= $fetch_consume['conversion_detail'];
					$conversion_detail['total_unit']= $fetch_consume['total_unit'];
					$conversion_detail['conversion_unit']=$fetch_consume['conversion_unit'];
					$conversion_detail['primary_value']=$fetch_consume['primary_value'];
					$product['conversion_detail'][]=$conversion_detail;
				}
			}
			else
			{
				$product['conversion_detail']=$conversion_detail;
			}
			
			
			$product['category_id']=$fetch_product['category_id'];
			$product['category_name']=$fetch_product['category_name'];
			$product['subcategory_id']=$fetch_product['subcategory_id'];
			$product['subcategory_name']=$fetch_product['subcategory_name'];



			$product['batch_detail']=array();
			$batch_detail=array();
			$res_batchdetail = mysqli_query($con,"SELECT * FROM tbl_distributor_transaction WHERE distributor_id='$dis_id' AND product_id='$proidval' AND batch_no!='' AND txn_type='Add'");
			if(mysqli_num_rows($res_batchdetail)>0)
			{
				while($fetch_batch=mysqli_fetch_assoc($res_batchdetail))
				{
					$actual_qtyval=$fetch_batch['quantity']-$fetch_batch['batch_qty_adjust'];
					if($actual_qtyval>0)
					{
						$batch_detail['transaction_id']=$fetch_batch['transaction_id'];
						$batch_detail['batch_no']=$fetch_batch['batch_no'];
						$batch_detail['expiry_date']=$fetch_batch['expiry_date'];
						$batch_detail['packing']=$fetch_batch['packing'];
						$batch_detail['stock_qty']=$actual_qtyval;
						$product['batch_detail'][]=$batch_detail;
					}
				}
			}
			$response['product'][]=$product;
		}
	}
	else
	{
		$response['product']=$product;
	}
	
	
	$count_dsr_yes=0;
	$count_dsr_no=0;
	$count_dsr_accept=0;
	
	$da  = date("Y-m-d");
	$select_fos=mysqli_query($con,"SELECT user_id,user_name,user_phone FROM tbl_user where status='Active' and distributor_id='$dis_id' order by user_id ASC");
	if(mysqli_num_rows($select_fos)>0)
	{     
		$count_total_fse=mysqli_num_rows($select_fos);
		$response['fse_count']=$count_total_fse;
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
			$select_not_dsr=mysqli_query($con,"SELECT * FROM tbl_dsr where user_id='$userid' and date='$da' and dsr_status in ('Accept','Pending')");
			if(mysqli_num_rows($select_not_dsr)<=0)
			{
				$count_dsr_no++;
				$executive_not_submit['fse_id']=$userid;
				$executive_not_submit['dsr_id']='0';
				$executive_not_submit['fse_name']=$fetch_fos['user_name'];
				$executive_not_submit['fse_phone']=$fetch_fos['user_phone'];
				$executive_not_submit['status']='Not Submit';
				$executive_not_submit['total_amount']='0';
				$executive_not_submit['cash_detail']='0';
				$executive_not_submit['cheque_detail']='0';
				$executive_not_submit['dsr_date']='0';
				$executive_not_submit['dsr_time']='0';
				$executive_not_submit['submit_date']='0';
				$executive_not_submit['submit_time']='0';
				$response['executive_not_submit'][]=$executive_not_submit;
					
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
	else
	{
		$count_total_fse=0;
		$response['fse_count']='0';
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
	
	
	$closing=mysqli_query($con,"SELECT closing_amt,date,time FROM tbl_distributor_cash_collection WHERE distributor_id='$dis_id' AND date<='$da' order by date desc limit 1");
	$fetch_closing=mysqli_fetch_array($closing);
	if(mysqli_num_rows($closing)>0)
	{
		$response['cash_in_hand']=$fetch_closing['closing_amt'];
		$response['cash_in_hand_date']=$fetch_closing['date'];
		$response['cash_in_hand_time']=$fetch_closing['time'];
	}
	else
	{
		$response['cash_in_hand']=0;
		$response['cash_in_hand_date']='';
		$response['cash_in_hand_time']='';
	}
	$final_bank_closing_amt=0;
	$bank_detail=array();
	$select_bank_data=mysqli_query($con,"select * from tbl_distributor_bank_master where distributor_id='$dis_id' AND status= 'Active'" );
	if(mysqli_num_rows($select_bank_data)>0)
	{
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
	else
	{
		$response['bank_detail']=$bank_detail;
	}
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
	
	$res_terms = mysqli_query($con,"select * from tbl_dist_terms_conditions where distributor_id='$dis_id'");
	$a_terms=mysqli_fetch_assoc($res_terms);
	$response['terms_condition1']=$a_terms['terms_condition1'];	
	$response['terms_condition2']=$a_terms['terms_condition2'];	
	$response['terms_condition3']=$a_terms['terms_condition3'];	
	$response['terms_condition4']=$a_terms['terms_condition4'];	
	$response['terms_condition5']=$a_terms['terms_condition5'];
	$response['terms_condition6']=$a_terms['terms_condition6'];	
	$response['terms_condition7']=$a_terms['terms_condition7'];
	
	$res_terms_hindi = mysqli_query($con,"select * from tbl_dist_terms_conditions_hindi where distributor_id='$dis_id'");
	$a_terms_hindi=mysqli_fetch_assoc($res_terms_hindi);
	$response['hindi_terms_condition1']=$a_terms_hindi['terms_condition1'];	
	$response['hindi_terms_condition2']=$a_terms_hindi['terms_condition2'];	
	$response['hindi_terms_condition3']=$a_terms_hindi['terms_condition3'];	
	$response['hindi_terms_condition4']=$a_terms_hindi['terms_condition4'];	
	$response['hindi_terms_condition5']=$a_terms_hindi['terms_condition5'];	
	$response['hindi_terms_condition6']=$a_terms_hindi['terms_condition6'];	
	$response['hindi_terms_condition7']=$a_terms_hindi['terms_condition7'];	
	
	$pkt_bag_detail=array();
	$res = mysqli_query($con,"select * from tbl_distributor_bag_detail where distributor_id='$dis_id' and status in ('Active','Deactive') order by bag_qty asc");
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_user=mysqli_fetch_array($res))
		{
			$pkt_bag_detail['bag_id']=$fetch_user['bag_id'];
			$pkt_bag_detail['bag_qty']=$fetch_user['bag_qty'];
			$pkt_bag_detail['status']=$fetch_user['status'];
			$response['pkt_bag_detail'][]=$pkt_bag_detail;
		}
	}
	else
	{
		$response['pkt_bag_detail']=$pkt_bag_detail;	
	}
	
	$res_operator = mysqli_query($con,"select * from tbl_distributor_operator_detail where distributor_id='$dis_id' and status='Active' order by operator_name asc");
	$operator_master=array();
	if(mysqli_num_rows($res_operator)>0)
	{     
		while($fetch_operator=mysqli_fetch_array($res_operator))
		{
			$operator_master['detail_id']=$fetch_operator['detail_id'];
			$operator_master['operator_name']=$fetch_operator['operator_name'];
			$response['operator_master'][]=$operator_master;
		}
	}
	else
	{
	  $response['operator_master']=$operator_master;
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
	
	$res_pro_gst_detail=mysqli_query($con,"select * from tbl_gst_master where status='Active' and company_id='1' order by gst_type asc");
	$pro_gst_master=array();
	if(mysqli_num_rows($res_pro_gst_detail)>0)
	{     
		while($fetch_gst=mysqli_fetch_array($res_pro_gst_detail))
		{
			$pro_gst_master['gst_rate']=$fetch_gst['gst_type'];
			$response['pro_gst_master'][]=$pro_gst_master;
		}
	}
	else
	{
	  $response['pro_gst_master']=$pro_gst_master;
	}
	
	
	$response['freeze_status']=$freeze_status;
	$response['current_month_detail']=date("M");
	$response['current_year']=date("Y");
	$response['fse_count']=$count_total_fse;
	$response['dsr_submit_count']=$count_dsr_yes;
	$response['dsr_not_submit_count']=$count_dsr_no;
	$response['dsr_accept_count']=$count_dsr_accept;
	$response['digital_transfer']='Yes';
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