<?php
$response = array();
include("../../connect.php");
include("create_log.php");
$file = '../log/party_order.log';
if(isset($_POST['transaction_unique_id']) && isset($_POST['key_uid']) && isset($_POST['amount']) && isset($_POST['total_order']) && isset($_POST['key_pid']) && isset($_POST['payment_mode']) && isset($_POST['payment_status']) && isset($_POST['distributor_id']) && isset($_POST['disc_amt']) && isset($_POST['final_amt']) && isset($_POST['invoice_type']) &&isset($_POST['cess_amount']))
{  
    $transaction_unique_id = $_POST['transaction_unique_id'];
    $query_check = mysqli_query($con,"SELECT `transaction_unique_id` FROM `tbl_party_transaction` WHERE `transaction_unique_id`='$transaction_unique_id'");
    if(mysqli_num_rows($query_check)==0){
    	$client1 = $_POST['key_uid'];
    	$amount = $_POST['amount']; 
    	$disc_amt = $_POST['disc_amt'];  
    	$round_off_amt = $_POST['round_off_amt'];  
    	$final_amt = $_POST['final_amt']; 	
    	$toder = $_POST['total_order'];
    	$p_client = $_POST['key_pid'];
    	$cess_amt = $_POST['cess_amount'];  
    	$serial_bill = isset($_POST['serial_bill']) ? $_POST['serial_bill'] : '';
    	$gstconfig=isset($_POST['gstconfig']) ? $_POST['gstconfig'] : '';
    	$credit_days = isset($_POST['credit_days']) ? $_POST['credit_days'] : '0';
    	$tds_amt = isset($_POST['tds_amt']) ? $_POST['tds_amt'] : '';
    	$latitude = isset($_POST['latitude']) ? $_POST['latitude'] : '';
    	$longitude = isset($_POST['longitude']) ? $_POST['longitude'] : '';
    	$party_gstin = isset($_POST['party_gstin']) ? $_POST['party_gstin'] : '';
    	$pmode = $_POST['payment_mode'];   
    	$pstatus = $_POST['payment_status'];
    	$dis_id = $_POST['distributor_id'];
		date_default_timezone_set('Asia/Calcutta');
		$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
		if(mysqli_num_rows($disSql)>0)
		{
			$disRow = mysqli_fetch_array($disSql);
			if($disRow['country']=='United Arab Emirates')
				date_default_timezone_set('Asia/Dubai');
		}
    	$remark=$_POST['remark'];
    	$invoice_type1=$_POST['invoice_type'];
    	$labouramt=isset($_POST['labouramt']) ? $_POST['labouramt'] : '0';
    	$freightamt=isset($_POST['freightamt']) ? $_POST['freightamt'] : '0';
    	$otherexpamt=isset($_POST['otherexpamt']) ? $_POST['otherexpamt'] : '0';
    	
    	$request_id = isset($_POST['request_id']) ? $_POST['request_id'] : '';
    	
    	$courier_facility = isset($_POST['courier_facility']) ? $_POST['courier_facility'] : 'No';
    	$courier_no = isset($_POST['courier_no']) ? $_POST['courier_no'] : '';
    	$reference_no = isset($_POST['reference_no']) ? $_POST['reference_no'] : '';
    	$courier_date = isset($_POST['courier_date']) ? $_POST['courier_date'] : '';
    	$courier_company = isset($_POST['courier_company']) ? $_POST['courier_company'] : '';
    	
    	$tcs_perc = isset($_POST['tcs_perc']) ? $_POST['tcs_perc'] : '0';
    	$tcs_applicable = isset($_POST['tcs_applicable']) ? $_POST['tcs_applicable'] : 'No';
    	$tcs_Amt = isset($_POST['tcs_Amt']) ? $_POST['tcs_Amt'] : '0';
    	
    	if($courier_date!='')
    	{
    		$temp_string=explode("/",$courier_date);
    		$temp_string2=$temp_string[1];
    		$temp_string3=$temp_string[2];
    		$temp_data_date=$temp_string[0]."-".$temp_string2."-".$temp_string3;
    		$temp_date2=strtotime($temp_data_date);
    		$courier_date=date("Y-m-d",$temp_date2);
    	}
    	
    	$consignee_name = isset($_POST['consignee_name']) ? $_POST['consignee_name'] : '';
    	$g_r_no = isset($_POST['g_r_no']) ? $_POST['g_r_no'] : '';
    	$transport_date = isset($_POST['transport_date']) ? $_POST['transport_date'] : '';
    	$transport_address = isset($_POST['transport_address']) ? $_POST['transport_address'] : '';
    	$transport_company = isset($_POST['transport_company']) ? $_POST['transport_company'] : '';
    	
    	$message_txn_id = isset($_POST['message_txn_id']) ? $_POST['message_txn_id'] : '';
    	$party_number = isset($_POST['party_number']) ? $_POST['party_number'] : '';
    	$message_date = isset($_POST['message_date']) ? $_POST['message_date'] : '';
    	$message_time = isset($_POST['message_time']) ? $_POST['message_time'] : '';
    	$message_amount = isset($_POST['message_amount']) ? $_POST['message_amount'] : '';
    	$scro = date("H:i:s");
    	$da  = date("Y-m-d");
    	$scri =$da." ".$scro;
    	$temp_date2=strtotime($da);
    	$msg_insert_check=0;
    	if($message_txn_id!='')
    	{
    		$select_message=mysqli_query($con,"select * from `tbl_retailer_message_detail` where user_id='$client1' and transaction_id='$message_txn_id'");
    		if(mysqli_num_rows($select_message)<=0)
    		{
    			$query_message=mysqli_query($con,"insert into tbl_retailer_message_detail(`user_id`,`transaction_id`,`amount`,`message_date`,`message_time`,`party_phone`,`insert_date`,`insert_time`,`status`,`complete_date`,`complete_time`)values('$client1','$message_txn_id','$message_amount','$message_date','$message_time','$party_number','$da','$scro','Complete','$da','$scro')");
    			$msg_insert_check=0;
    		}
    		else
    		{
    			$msg_insert_check=1;
    		}
    	}
    	if($msg_insert_check==0)
    	{
    		include("../client_bill_sequence.php");
    		$SendSequence=new SendSequence();
    		$sd=$SendSequence->fetch_sequence($dis_id,$invoice_type1,$con);
    		if($sd!='')
    		{
    			$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
    			$query ="insert into tbl_party_transaction(transaction_id,transaction_date,transaction_time,transaction_bill_number,transaction_from,transaction_to,total_amount,payment_mode,payment_status,remark,disc_amt,final_amt,bill_type,cess_amount,round_off_amt,serial_no_bill,credit_days,bill_date,latitude,longitude,courier_facility,courier_no,reference_no,courier_date,courier_company,message_txn_id,consignee_name,transport_company,g_r_no,transport_date,transport_address,tds_amt,party_gstin,labour_charges,freight_charges,other_expenses,generated_by,source,gst_configure,txn_service_type,is_tcs,tcs_amount,final_amt_w_tcs,tcs_percentage,transaction_unique_id,process_stage)values('$transaction_id','$da','$scro','$sd','$client1','$p_client','$amount','$pmode','$pstatus','$remark','$disc_amt','$final_amt','$invoice_type1','$cess_amt','$round_off_amt','$serial_bill','$credit_days','$da','$latitude','$longitude','$courier_facility','$courier_no','$reference_no','$courier_date','$courier_company','$message_txn_id','$consignee_name','$transport_company','$g_r_no','$transport_date','$transport_address','$tds_amt','$party_gstin','$labouramt','$freightamt','$otherexpamt','','Admin','$gstconfig','Retail','$tcs_applicable','$tcs_Amt','$final_amt','$tcs_perc','$transaction_unique_id','T1')";
    			$res = mysqli_query($con,$query);	
    			if($res)
    			{
    				$query1="SELECT transaction_id FROM  tbl_party_transaction where transaction_from ='$client1' and transaction_to='$p_client' ORDER BY `id` DESC LIMIT 1";
    				$res1 = mysqli_query($con,$query1);
    				$row =  mysqli_fetch_assoc($res1);
    				if(mysqli_num_rows($res1)>0)
    				{		
    					$re= $row['transaction_id'];
    					$json_a=json_decode($toder, true);     
    					foreach ($json_a as $person_a)
    					{
    						$prodid=$person_a['pid'];
    						$prodname=$person_a['pname'];
    						$ordquantiy=$person_a['quantity'];
    						$cgstamt = isset($person_a['cgst_amt']) ? $person_a['cgst_amt'] : '';
    						$sgstamt = isset($person_a['sgst_amt']) ? $person_a['sgst_amt'] : '';
    						$igstamt = isset($person_a['igstamt']) ? $person_a['igstamt'] : '';
    						$proprice=$person_a['pro_price'];
    						$dis_type = isset($person_a['discount_type']) ? $person_a['discount_type'] : '';
    						$dis_per = isset($person_a['discount_percen']) ? $person_a['discount_percen'] : '';
    						$cess_per_amt = isset($person_a['cess_per_amt']) ? $person_a['cess_per_amt'] : '';
    						$cess_percentage = isset($person_a['cess_percentage']) ? $person_a['cess_percentage'] : '';
    						$cess_final_amt = isset($person_a['cess_final_amt']) ? $person_a['cess_final_amt'] : '';
    						$pro_discount = isset($person_a['pro_discount']) ? $person_a['pro_discount'] : '';
    						$pro_imei_no = isset($person_a['pro_imei_no']) ? $person_a['pro_imei_no'] : '';
    						$pro_gst_perc = isset($person_a['gst_perc']) ? $person_a['gst_perc'] : '0';
    						$pur_total_amt = isset($person_a['pur_total_amt']) ? $person_a['pur_total_amt'] : '0';
    						$pur_taxable_amt = isset($person_a['pur_taxable_amt']) ? $person_a['pur_taxable_amt'] : '0';
    						
    						
    						$query2=mysqli_query($con,"insert into tbl_party_transaction_detail(transaction_id,product_id,product_name,quantity,CGST_amount,SGST_amount,product_price,discount_type,discount_percentage,cess_pc_amt,cess_percentage,cess_final_amt,product_disc,IMEI_NO,IGST_amount,gst_perc,product_total_amt,taxable_amount)values('$re','$prodid','$prodname','$ordquantiy','$cgstamt','$sgstamt','$proprice','$dis_type','$dis_per','$cess_per_amt','$cess_percentage','$cess_final_amt','$pro_discount','$pro_imei_no','$igstamt','$pro_gst_perc','$pur_total_amt','$pur_taxable_amt')");
    						if($query2){
        					    $update_process_stage = mysqli_query($con,"UPDATE `tbl_party_transaction` SET `process_stage`='T2' WHERE `transaction_unique_id`='$transaction_unique_id'");
        					}
    						$product_detail=mysqli_query($con,"SELECT * FROM tbl_product where product_id='$prodid' and product_type='Serial No'");
    						if(mysqli_num_rows($product_detail)>0)
    						{  
    							$uq=mysqli_query($con,"UPDATE tbl_product_serialno SET status='Sold',saleout_date='$da',saleout_time='$scro' where IMEI ='$pro_imei_no' and product_id='$prodid'");	
    						}
    						
    						$query_stock="SELECT closing_stock FROM  tbl_distributor_stock where date ='$da' and distributor_id='$dis_id' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1";
    						$res_stock = mysqli_query($con,$query_stock);
    						$row_stock =  mysqli_fetch_assoc($res_stock);
    						if(mysqli_num_rows($res_stock)>0)
    						{
    							$stock_quantity=$row_stock['closing_stock'];
    							$temp_quantity=round($stock_quantity-$ordquantiy,2);
    							$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity' where date ='$da' and distributor_id='$dis_id' and product_id='$prodid'");	
    							if($uq){
            					    $update_process_stage = mysqli_query($con,"UPDATE `tbl_party_transaction` SET `process_stage`='T3' WHERE `transaction_unique_id`='$transaction_unique_id'");
            					}
    							$uq_product=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity' where distributor_id='$dis_id' and product_id='$prodid'");
    						}
    						else
    						{
    							$query_stock1="SELECT closing_stock FROM  tbl_distributor_stock where date <='$da' and distributor_id='$dis_id' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1";
    							$res_stock1 = mysqli_query($con,$query_stock1);
    							$row_stock1 =  mysqli_fetch_assoc($res_stock1);
    							if(mysqli_num_rows($res_stock1)>0)
    							{
    								$stock_quantity=$row_stock1['closing_stock'];
    								$temp_quantity=round($stock_quantity-$ordquantiy,2);
    								$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,closing_stock,opening_stock,date)values('$dis_id','$prodid','$temp_quantity','$stock_quantity','$da')");
    								if($stock_insert){
                					    $update_process_stage = mysqli_query($con,"UPDATE `tbl_party_transaction` SET `process_stage`='T3' WHERE `transaction_unique_id`='$transaction_unique_id'");
                					}
    								$uq_product=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity' where distributor_id='$dis_id' and product_id='$prodid'");
    							}
    						}
    					}
    				}  
    				
    				 /*create log section 26-December-2017 */
    					$complete_time=date('d/M/Y:H:i:s');
    					$txtdata="=====Party Order Detail====\n\nTime:".$complete_time."\n Distributor-Id:".$dis_id."\n User_id:".$client1."\n Party_id:".$p_client."\n order_detail: \n\n".$toder."\n\n=====Party Order Detail Completion=====\n";
    					$log=new Log();
    					$res3=$log->createLog($file,$txtdata);
    				/*end log section */
    				// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$dis_id', 'INSERT+UPDATE OPERATION,Distributor Credit Party Order#Admin(INSERT)tbl_party_transaction,tbl_party_transaction_detail,tbl_retailer_message_detail#(INSERT+UPDATE)tbl_product,tbl_distributor_stock,tbl_user_request', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
    				/*Created On 07-Feb-2018 For User Request*/
    				if($request_id!='')
    				{
    				 $update_flag=mysqli_query($con,"UPDATE tbl_user_request SET transaction_status='Completed', party_transaction_id='$re' WHERE transaction_id='$request_id'");	
    				}
    				/* end */
    
    				if($pmode=='Credit')
    				{
    					include("sale-purchase-balance-effect-class.php");
    					$CashCollection=new Collectionbalance();
    					$collections=$CashCollection->salecollection($dis_id,$final_amt,$da,$p_client);
    				}
    				
    				$update_process_stage = mysqli_query($con,"UPDATE `tbl_party_transaction` SET `process_stage`='T3' WHERE `transaction_unique_id`='$transaction_unique_id'");	
    				$response['success']=1;
    				$response['success_stage']='T3';
    				$response['details']=$sd;
    				$response['pmode']=$pmode;
    			}
    			else
    			{
    				$response['success']=0;
    				$response['details']="Insertion Error...!!";
    			}
    		}
    		else
    		{
    			$response['success']=0;
    			$response['details']="Insertion Error...!!";
    		}
    	}
    	else
    	{
    		$response['success']=0;
    		$response['details']="Message transaction id already exists!";
    	}
    }else{
        $update = mysqli_query($con,"UPDATE `tbl_party_transaction` SET `error_msg`='An attempt has been made to generate the bill again on this transaction id.' WHERE `transaction_unique_id`='$transaction_unique_id'");
        $response['success'] = 0;
	    $response['details'] = $transaction_unique_id." This Transaction ID Already Available!!";
    }
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 