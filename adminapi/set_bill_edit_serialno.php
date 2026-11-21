<?php
include("../../connect.php");
$response = array();
if(isset($_POST['bill_txn_id']) && isset($_POST['distributor_id']))
{
	$bodydata = print_r($_POST, true);
	$session_dist_ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$query_log=mysqli_query($con,"insert into tbl_sale_log_data(`distributor_id`,`transaction_date`,`log_data`,`source`,`edit_flag`)values('$session_dist_ver','$da','$bodydata','Admin','Yes')");
	$scri =$da." ".$scro;
	$billtxn_id=$_POST['bill_txn_id'];
	$dist_bill_source=$_POST['dist_bill_source'];
	$dist_dsr_require=$_POST['dsr_requirement'];
	$pp_id1=$_POST['party_id'];
	$pp_gstin=$_POST['gstin_no'];
	$client1 =$_POST['user_id'];
	$pmode = $_POST['payment_mode'];
	$tcs_amount=$_POST['tcs_amount'];
	$toder = $_POST['product_order_json'];
	$tcs_applicable ="No";
	if($tcs_amount>0) { $tcs_applicable ="Yes"; }
	$labouramt=$_POST['labouramt'];
	$freightamt=$_POST['freightamt'];
	$otherexpamt=$_POST['otherexpamt'];
	$bank_name = isset($_POST['cheque_bank']) ? $_POST['cheque_bank'] : '';
	$cheque_no = isset($_POST['cheque_number']) ? $_POST['cheque_number'] : '';
	$cheque_date = isset($_POST['cheque_date']) ? $_POST['cheque_date'] : '';
	$dist_gst_config=$_POST['dist_gst_config'];
	$cal_total_amt=round($_POST['tot_amt_val']+$labouramt+$freightamt+$otherexpamt,2);
	$disc_amt = $_POST['calculate_disc_amt'];
	$discount_on_total=$_POST["discount_on_total"];
	$final_amt_val=$_POST['final_net_amount'];
	$round_off_amt=$_POST['round_off_amt'];
	$cheque_amt=$_POST['cheque_amt'];
	$cash_amt=$_POST['cash_amt'];
	$pstatus=$_POST['payment_status'];
	$res_final = mysqli_query($con,"select * from tbl_party_transaction where transaction_id='$billtxn_id'");
	if(mysqli_num_rows($res_final)>0)
	{
		$fetch_res=mysqli_fetch_assoc($res_final);
		$da_txn=$fetch_res['transaction_date'];
		if($dist_bill_source=='')
			$client1=$fetch_res['transaction_from'];
		$pre_party_id=$fetch_res['transaction_to'];
		$audit_party_txn=mysqli_query($con,"INSERT INTO `tbl_bill_edit_audit`(`transaction_id`,`transaction_bill_number`,`txn_type`, `transaction_date`, `transaction_time`,`transaction_from`,`transaction_to`, `party_gstin`,`total_amount`, `discount_on_total`, `disc_amt`, `tds_amt`,`round_off_amt`, `final_amt`, `labour_charges`,`freight_charges`,`other_expenses`,`operator_detail`, `tcs_percentage`,`is_tcs`, `tcs_amount`,`final_amt_w_tcs`,  `bill_cgst`,`bill_sgst`, `bill_igst`, `converted_transaction_id`,`payment_type`,`online_amt`, `cess_amount`, `payment_mode`,`payment_status`, `credit_days`,`bank_id`,`bank_name`, `cheque_no`, `cheque_date`, `supply_place`, `reverse_charge`, `cash_amount`, `cheque_amount`, `remark`, `cash_receipt_date`, `bill_type`, `barcode_bill`, `serial_no_bill`, `consignee_name`, `transport_company`, `g_r_no`,`transport_date`,`transport_address`,`message_txn_id`,`courier_facility`, `courier_no`, `reference_no`,`courier_date`,`courier_company`,`bill_date`, `reason`,`generated_by`,`insert_datetime`,`action_by`, `transaction_bill_type`, `txn_service_type`, `source`, `gst_configure`, `autofill_bill`, `gst_invoice_generation`, `txn_id`) VALUES ('$billtxn_id','".$fetch_res['transaction_bill_number']."', '".$fetch_res['txn_type']."','".$fetch_res['transaction_date']."', '".$fetch_res['transaction_time']."','".$fetch_res['transaction_from']."','".$fetch_res['transaction_to']."','".$fetch_res['party_gstin']."','".$fetch_res['total_amount']."','".$fetch_res['discount_on_total']."', '".$fetch_res['disc_amt']."','".$fetch_res['tds_amt']."','".$fetch_res['round_off_amt']."','".$fetch_res['final_amt']."','".$fetch_res['labour_charges']."','".$fetch_res['freight_charges']."','".$fetch_res['other_expenses']."','".$fetch_res['operator_detail']."','".$fetch_res['tcs_percentage']."','".$fetch_res['is_tcs']."','".$fetch_res['tcs_amount']."','".$fetch_res['final_amt_w_tcs']."','".$fetch_res['bill_cgst']."','".$fetch_res['bill_sgst']."','".$fetch_res['bill_igst']."','".$fetch_res['converted_transaction_id']."','".$fetch_res['payment_type']."','".$fetch_res['online_amt']."','".$fetch_res['cess_amount']."','".$fetch_res['payment_mode']."','".$fetch_res['payment_status']."','".$fetch_res['credit_days']."','".$fetch_res['bank_id']."','".$fetch_res['bank_name']."','".$fetch_res['cheque_no']."','".$fetch_res['cheque_date']."','".$fetch_res['supply_place']."','".$fetch_res['reverse_charge']."','".$fetch_res['cash_amount']."','".$fetch_res['cheque_amount']."','".$fetch_res['remark']."','".$fetch_res['cash_receipt_date']."','".$fetch_res['bill_type']."','".$fetch_res['barcode_bill']."','".$fetch_res['serial_no_bill']."','".$fetch_res['consignee_name']."','".$fetch_res['transport_company']."','".$fetch_res['g_r_no']."','".$fetch_res['transport_date']."','".$fetch_res['transport_address']."','".$fetch_res['message_txn_id']."','".$fetch_res['courier_facility']."','".$fetch_res['courier_no']."','".$fetch_res['reference_no']."','".$fetch_res['courier_date']."','".$fetch_res['courier_company']."','".$fetch_res['bill_date']."','".$fetch_res['reason']."','".$fetch_res['generated_by']."','$scri','$session_dist_ver','".$fetch_res['transaction_bill_type']."','".$fetch_res['txn_service_type']."','".$fetch_res['source']."','".$fetch_res['gst_configure']."','".$fetch_res['autofill_bill']."','".$fetch_res['gst_invoice_generation']."','".$fetch_res['txn_id']."')");
		$re_txn_detail = mysqli_insert_id($con);
		if($audit_party_txn)
		{
			$ac_cash_amt=$cash_amt-$fetch_res['cash_amount'];
			if($fetch_res['source']=='')
			{
				$res_dsr = mysqli_query($con,"select * from tbl_dsr where user_id='$client1' and date='$da_txn' and dsr_status != 'Reject'");
				if(mysqli_num_rows($res_dsr)>0 || $ac_cash_amt!=0)
				{
					$fetch_dsr_detail=mysqli_fetch_assoc($res_dsr);
					if($fetch_dsr_detail['dsr_status']=='Accept') {
						$dsr_adjustment=mysqli_query($con,"INSERT INTO `tbl_dsr_bill_edit_adjustment`(`transaction_id`, `amount`, `bill_date`, `fse_id`) VALUES ('$billtxn_id','$ac_cash_amt','$da_txn','$client1')");
					}
					else {
						$dsr_adjustment=mysqli_query($con,"update tbl_dsr set dsr_status='Reject',accept_reject_datetime='$scri' where user_id='$client1' and date='$da_txn' and dsr_status='Pending'");
					}
				}
			}
			$uq_sequence11=mysqli_query($con,"UPDATE tbl_party_transaction SET transaction_from='$client1',transaction_to='$pp_id1',total_amount='$cal_total_amt',payment_mode='$pmode',payment_status='$pstatus',bank_name='$bank_name',cheque_no='$cheque_no',cash_amount='$cash_amt',cheque_amount='$cheque_amt',cheque_date='$cheque_date',disc_amt='$disc_amt',final_amt='$final_amt_val',round_off_amt='$round_off_amt', discount_on_total='$discount_on_total',party_gstin='$pp_gstin',labour_charges='$labouramt',freight_charges='$freightamt',other_expenses='$otherexpamt',gst_configure='$dist_gst_config',tcs_amount='$tcs_amount',is_tcs='$tcs_applicable',final_amt_w_tcs='$final_amt_val',bill_editable='Yes' where transaction_id='$billtxn_id'");
			$update_result = mysqli_query($con,"select * from tbl_party_transaction_detail where transaction_id='$billtxn_id'");
			while($fetch_detail=mysqli_fetch_assoc($update_result))
			{
				$stock_insert1=mysqli_query($con,"INSERT INTO `tbl_bill_edit_detail_audit`(`transaction_id`, `product_id`, `product_name`, `product_price`, `bag_type`, `bag_qty`, `quantity`, `free_qty`, `actual_quantity`, `product_disc`, `CGST_amount`, `SGST_amount`, `IGST_amount`, `gst_perc`, `product_total_amt`, `taxable_amount`, `batch_no`, `expiry_date`,`adjust_stock`,`packing`,`MRP`, `consume_detail`,`barcode`, `dis_type`,`IMEI_NO`) VALUES ('$re_txn_detail','".$fetch_detail['product_id']."','".$fetch_detail['product_name']."','".$fetch_detail['product_price']."','".$fetch_detail['bag_type']."','".$fetch_detail['bag_qty']."','".$fetch_detail['quantity']."','".$fetch_detail['free_qty']."','".$fetch_detail['actual_quantity']."','".$fetch_detail['product_disc']."','".$fetch_detail['CGST_amount']."','".$fetch_detail['SGST_amount']."','".$fetch_detail['IGST_amount']."','".$fetch_detail['gst_perc']."','".$fetch_detail['product_total_amt']."','".$fetch_detail['taxable_amount']."','".$fetch_detail['batch_no']."','".$fetch_detail['expiry_date']."','".$fetch_detail['adjust_stock']."','".$fetch_detail['packing']."','".$fetch_detail['MRP']."','".$fetch_detail['consume_detail']."','".$fetch_detail['barcode']."','".$fetch_detail['dis_type']."','".$fetch_detail['IMEI_NO']."')");
			}
			if($uq_sequence11)
			{
				$json_a=json_decode($toder, true);     
				foreach ($json_a as $fetch_product11)
				{
					$prodid=$fetch_product11['proid'];
					$prodname=$fetch_product11['product_name'];
					$ordquantiy=$fetch_product11['quantity'];
					$proprice=$fetch_product11['proprice'];
					$pro_discount = isset($fetch_product11['product_disc']) ? $fetch_product11['product_disc'] : '0';
					$cgstamt = isset($fetch_product11['cgst_amt']) ? $fetch_product11['cgst_amt'] : '';
					$sgstamt = isset($fetch_product11['sgst_amt']) ? $fetch_product11['sgst_amt'] : '';
					$igstamt = isset($fetch_product11['igstamt']) ? $fetch_product11['igstamt'] : '';
					$pro_gst_perc = isset($fetch_product11['gst_perc']) ? $fetch_product11['gst_perc'] : '0';
					$pur_total_amt = isset($fetch_product11['pur_total_amt']) ? $fetch_product11['pur_total_amt'] : '0';
					$pur_taxable_amt = isset($fetch_product11['pur_taxable_amt']) ? $fetch_product11['pur_taxable_amt'] : '0';		
					$p_imei_no = isset($fetch_product11['pro_imei_no']) ? $fetch_product11['pro_imei_no'] : '';
					
					$res_cart=mysqli_query($con,"SELECT * FROM tbl_party_transaction_detail WHERE transaction_id='$billtxn_id' and product_id='$prodid' and IMEI_NO='$p_imei_no'");
					if(mysqli_num_rows($res_cart)>0)
					{
						$fetch_final_bill_qty=mysqli_fetch_assoc($res_cart);
						if($p_imei_no=='')
							$ordquantiy=$ordquantiy-$fetch_final_bill_qty['quantity'];
						else
							$ordquantiy=$ordquantiy-1;
						$uq_sequence11=mysqli_query($con,"UPDATE tbl_party_transaction_detail SET product_name='$prodname',quantity='1',CGST_amount='$cgstamt',SGST_amount='$sgstamt',product_price='$proprice',product_disc='$pro_discount',IGST_amount='$igstamt',gst_perc='$pro_gst_perc', product_total_amt='$pur_total_amt',taxable_amount='$pur_taxable_amt',insert_at='$scri' where transaction_id='$billtxn_id' and product_id='$prodid' AND IMEI_NO='$p_imei_no'");
					}
					else
					{
						$uq_sequence11=mysqli_query($con,"insert into tbl_party_transaction_detail(transaction_id,product_id, product_name,quantity, CGST_amount, SGST_amount,product_price,product_disc,IGST_amount,gst_perc, product_total_amt, taxable_amount,IMEI_NO,insert_at)values('$billtxn_id','$prodid','$prodname','$ordquantiy', '$cgstamt','$sgstamt','$proprice','$pro_discount','$igstamt','$pro_gst_perc','$pur_total_amt','$pur_taxable_amt','$p_imei_no','$scri')");
						$uq=mysqli_query($con,"UPDATE tbl_product_serialno SET status='Sold',saleout_date='$da',saleout_time='$scro',user_id='$client1' where IMEI ='$p_imei_no' and product_id='$prodid'"); 
					}
					$actual_add_qty=$ordquantiy;
					if($actual_add_qty!=0) 
					{
						if($fetch_res['source']=="Web" || $fetch_res['source']=="Admin")
						{
							$res_stock = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date ='$da_txn' and distributor_id='$session_dist_ver' and product_id='$prodid'");
							if(mysqli_num_rows($res_stock)>0)
							{
								$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$actual_add_qty',2) where date ='$da_txn' and distributor_id='$session_dist_ver' and product_id='$prodid'");
								$uq1=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$actual_add_qty',2), opening_stock =round(opening_stock-'$actual_add_qty',2) where date >'$da_txn' and distributor_id='$session_dist_ver' and product_id='$prodid'");
								$uq2=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity-'$actual_add_qty',2),tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$session_dist_ver'");
							}
							else
							{
								$res_stock1 = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date <='$da_txn' and distributor_id='$session_dist_ver' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
								if(mysqli_num_rows($res_stock1)>0)
								{
									$row_stock1 =  mysqli_fetch_assoc($res_stock1);
									$stock_quantity=$row_stock1['closing_stock'];
									$temp_quantity=round($stock_quantity-$ordquantiy,2);
									$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id, opening_stock, closing_stock, date,time)values('$session_dist_ver','$prodid','$stock_quantity','$temp_quantity','$da_txn','$scro')");
									$uq1=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$actual_add_qty',2), opening_stock = round(opening_stock-'$actual_add_qty',2) where date >'$da_txn' and distributor_id='$session_dist_ver' and product_id='$prodid'");
									$uq2=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity-'$actual_add_qty',2),tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$session_dist_ver'");
								}
								else
								{
									$temp_quantity=$ordquantiy;
									$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id, opening_stock, closing_stock, date,time)values('$session_dist_ver','$prodid','0','-$temp_quantity','$da_txn','$scro')");
									$uq1=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$temp_quantity',2), opening_stock =round(opening_stock-'$temp_quantity',2) where date >'$da_txn' and distributor_id='$session_dist_ver' and product_id='$prodid'");
									$uq2=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity-'$temp_quantity',2),tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$session_dist_ver'");
								}
							}
						}
						else
						{
							$res_stock = mysqli_query($con,"SELECT * FROM tbl_user_stock where date ='$da_txn' and user_id='$client1' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
							if(mysqli_num_rows($res_stock)>0)
							{
								$uq=mysqli_query($con,"UPDATE tbl_user_stock SET quantity=round(quantity-'$actual_add_qty',2) where date ='$da_txn' and user_id='$client1' and product_id='$prodid'");
								$uq1=mysqli_query($con,"UPDATE tbl_user_stock SET quantity=round(quantity-'$actual_add_qty',2), opening_stock=round(opening_stock-'$actual_add_qty',2) where date >'$da_txn' and user_id='$client1' and product_id='$prodid'");
							}
							else
							{
								$res_stock1 = mysqli_query($con,"SELECT * FROM tbl_user_stock where date <='$da_txn' and user_id='$client1' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
								if(mysqli_num_rows($res_stock1)>0)
								{
									$row_stock1 =  mysqli_fetch_assoc($res_stock1);
									$stock_quantity=$row_stock1['quantity'];
									$temp_quantity=round($stock_quantity-$ordquantiy,2);
									$stock_insert=mysqli_query($con,"insert into tbl_user_stock(user_id,product_id,opening_stock, quantity,date)values('$client1','$prodid','$stock_quantity','$temp_quantity','$da_txn')");
									$uq1=mysqli_query($con,"UPDATE tbl_user_stock SET quantity=round(quantity-'$actual_add_qty',2), opening_stock = round(opening_stock-'$actual_add_qty',2) where date >'$da_txn' and user_id='$client1' and product_id='$prodid'");
								}
								else
								{
									$temp_quantity=$ordquantiy;
									$stock_insert=mysqli_query($con,"insert into tbl_user_stock(user_id,product_id,opening_stock, quantity,date)values('$client1','$prodid','0','-$temp_quantity','$da_txn')");
									$uq1=mysqli_query($con,"UPDATE tbl_user_stock SET quantity=round(quantity-'$actual_add_qty',2), opening_stock = round(opening_stock-'$actual_add_qty',2) where date >'$da_txn' and user_id='$client1' and product_id='$prodid'");
								}
							}
						}
					}
				}
				if($uq_sequence11)
				{
					$clear_bill_unuse_pro=mysqli_query($con,"select * FROM tbl_party_transaction_detail WHERE transaction_id='$billtxn_id' and insert_at!='$scri'");
					if(mysqli_num_rows($clear_bill_unuse_pro)>0)
					{
						while($fetch_remove_pro=mysqli_fetch_assoc($clear_bill_unuse_pro))
						{
							$temp_txn_detailid=$fetch_remove_pro['transaction_detail_id'];
							$temp_quantity=$fetch_remove_pro['quantity'];
							$prodid=$fetch_remove_pro['product_id'];
							$p_imei_no=$fetch_remove_pro['IMEI_NO'];
							if($fetch_res['source']=="Web" || $fetch_res['source']=="Admin")
							{
								$uq_update=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock+'$temp_quantity',2) where date ='$da_txn' and distributor_id='$session_dist_ver' and product_id='$prodid'");
								$uq_update1=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock+'$temp_quantity',2),opening_stock = round(opening_stock+'$temp_quantity',2) where date >'$da_txn' and distributor_id='$session_dist_ver' and product_id='$prodid'");
								$uq2=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity+'$temp_quantity',2),tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$session_dist_ver'");
								$uq_imei_update=mysqli_query($con,"UPDATE tbl_product_serialno SET status='Available',saleout_date='', saleout_time='', user_id='0', request_id='0' where IMEI ='$p_imei_no' and product_id='$prodid'"); 
							}
							else
							{
								$uq_update=mysqli_query($con,"UPDATE tbl_user_stock SET quantity=round(quantity+'$temp_quantity',2) where date ='$da_txn' and user_id='$client1' and product_id='$prodid'");
								$uq_update1=mysqli_query($con,"UPDATE tbl_user_stock SET quantity=round(quantity+'$temp_quantity',2),opening_stock=round(opening_stock+'$temp_quantity',2) where date >'$da_txn' and user_id='$client1' and product_id='$prodid'");
								$uq_imei_update=mysqli_query($con,"UPDATE tbl_product_serialno SET status='Available',saleout_date='', saleout_time='' where IMEI ='$p_imei_no' and product_id='$prodid'"); 
							}
							if($uq_update)
							{
								$update_bill_unuse_pro=mysqli_query($con,"delete FROM tbl_party_transaction_detail WHERE transaction_id='$billtxn_id' and product_id ='$prodid' and transaction_detail_id='$temp_txn_detailid'");
							}
						}
					}
				
					if($uq_sequence11 || $update_bill_unuse_pro)
					{
						$current_bill_net_amt=0;
						if($pmode=='Credit')
							$current_bill_net_amt=$final_amt_val;
						include("sale-purchase-balance-effect-class.php");
						if(($pmode=='Credit' || $previos_net_amt>0) && $pre_party_id==$pp_id1)
						{
							$finalamtval=$current_bill_net_amt-$previos_net_amt;
							$CashCollection=new Collectionbalance();
							$collections=$CashCollection->salecollection($session_dist_ver,$finalamtval,$da_txn,$pp_id1);
						}
													
						if(($pmode=='Credit' || $previos_net_amt>0) && $pre_party_id!=$pp_id1)
						{
							$finalamtval=0-$previos_net_amt;
							$CashCollection=new Collectionbalance();
							$collections=$CashCollection->salecollection($session_dist_ver,$finalamtval,$da_txn,$pre_party_id);
							if($current_bill_net_amt>0)
								$collections=$CashCollection->salecollection($session_dist_ver,$current_bill_net_amt,$da_txn,$pp_id1);
						}
						
						if($ac_cash_amt!=0 and $dist_dsr_require=='Yes')
						{
							include("cash_bank_effect_class.php");
							if($pmode=='Cash')
							{
								$CashCollection=new Collection();
								$collections=$CashCollection->cashcollection($session_dist_ver,$ac_cash_amt,$da_txn);
							}
							else if($pmode=='Both' && $cash_amt!=0)
							{
								$CashCollection=new Collection();
								$collections=$CashCollection->cashcollection($session_dist_ver,$ac_cash_amt,$da_txn);
							}
						}
						$response['success']='1';
						$response['details']="Bill Successfully Updated";
						
						$response['url']="download_serialno_receipt.php?id=".$billtxn_id."&user_id=".$session_dist_ver."&lng=eng";
						$response['url_hindi']="download_serialno_receipt.php?id=".$billtxn_id."&user_id=".$session_dist_ver."&lng=hnd";
							
					}
					else
					{	
						$response['success']='0';
						$response['details']="Error At The Time of Product Audit Trail !!";
					}
				}
			}
		}
		else
		{
			$response['success']='0';
			$response['details']="Error At The Time of Bill Audit Trail !!";
		}
	}
	else
	{
		$response['success']='0';
		$response['details']="Bill Detail Not Valid. !!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>