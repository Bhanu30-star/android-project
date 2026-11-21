<?php

$response = array();

include("../../connect.php");

if(isset($_POST['key_uid']) && isset($_POST['amount']) && isset($_POST['total_order']) && isset($_POST['key_pid']) && isset($_POST['payment_mode']) && isset($_POST['payment_status']) && isset($_POST['distributor_id']) && isset($_POST['disc_amt']) && isset($_POST['final_amt']) && isset($_POST['invoice_type']) &&isset($_POST['cess_amount']))

{  

	$bank_name="";

	$cheque_no="";

	$cheque_date="";

	$client1 = $_POST['key_uid'];

	$amount = $_POST['amount'];  

	$disc_amt = $_POST['disc_amt'];  

	$final_amt = $_POST['final_amt']; 

	$cess_amt = $_POST['cess_amount'];

	$round_off_amt = $_POST['round_off_amt']; 	

	$toder = $_POST['total_order'];

	$p_client = $_POST['key_pid']; 

	$photoname='';

	$sign_image = isset($_FILES['sign_image']['name']) ? $_FILES['sign_image']['name'] : '';

	if($sign_image!="")

	{

		$destination = "../retailer_bill_signature/";

		$photoname=basename($_FILES['sign_image']['tmp_name']).'.jpg';

		move_uploaded_file($_FILES['sign_image']['tmp_name'], $destination.''.$photoname);	

	}

	$labouramt=isset($_POST['labouramt']) ? $_POST['labouramt'] : '0';

	$freightamt=isset($_POST['freightamt']) ? $_POST['freightamt'] : '0';

	$otherexpamt=isset($_POST['otherexpamt']) ? $_POST['otherexpamt'] : '0';

	$party_gstin = isset($_POST['party_gstin']) ? $_POST['party_gstin'] : '';

	$pmode = $_POST['payment_mode'];

	$serial_bill = isset($_POST['serial_bill']) ? $_POST['serial_bill'] : '';

	$latitude = isset($_POST['latitude']) ? $_POST['latitude'] : '';

	$longitude = isset($_POST['longitude']) ? $_POST['longitude'] : '';

	$pstatus = $_POST['payment_status'];

	$bank_name = isset($_POST['bank_name']) ? $_POST['bank_name'] : '';

	$cheque_no = isset($_POST['cheque_no']) ? $_POST['cheque_no'] : '';

	$cheque_date = isset($_POST['cheque_date']) ? $_POST['cheque_date'] : '';

	$credit_days = isset($_POST['credit_days']) ? $_POST['credit_days'] : '0';

	$message_txn_id = isset($_POST['message_txn_id']) ? $_POST['message_txn_id'] : '';

	$g_r_no = isset($_POST['g_r_no']) ? $_POST['g_r_no'] : '';

	$transport_date = isset($_POST['transport_date']) ? $_POST['transport_date'] : '';

	$transport_address = isset($_POST['transport_address']) ? $_POST['transport_address'] : '';

	$transport_company = isset($_POST['transport_company']) ? $_POST['transport_company'] : '';

	$tds_amt = isset($_POST['tds_amt']) ? $_POST['tds_amt'] : '';

	$dis_id = $_POST['distributor_id'];

	$remark=$_POST['remark'];

	$invoice_type1=$_POST['invoice_type'];

	

	date_default_timezone_set('Asia/Calcutta');

	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");

	if(mysqli_num_rows($disSql)>0)

	{

		$disRow = mysqli_fetch_array($disSql);

		if($disRow['country']=='United Arab Emirates')

			date_default_timezone_set('Asia/Dubai');

	}

	

	$courier_facility = isset($_POST['courier_facility']) ? $_POST['courier_facility'] : 'No';

	$courier_no = isset($_POST['courier_no']) ? $_POST['courier_no'] : '';

	$reference_no = isset($_POST['reference_no']) ? $_POST['reference_no'] : '';

	$courier_date = isset($_POST['courier_date']) ? $_POST['courier_date'] : '';

	$courier_company = isset($_POST['courier_company']) ? $_POST['courier_company'] : '';

	

	if($courier_date!='')

	{

		$temp_string=explode("/",$courier_date);

		$temp_string2=$temp_string[1];

		$temp_string3=$temp_string[2];

		$temp_data_date=$temp_string[0]."-".$temp_string2."-".$temp_string3;

		$temp_date2=strtotime($temp_data_date);

		$courier_date=date("Y-m-d",$temp_date2);

	}

	$cash_amt=0;

	$cheque_amt=0;



	$scro = date("H:i:s");

	$da  = date("Y-m-d");

	$scri =$da." ".$scro;

	$temp_date2=strtotime($da);

	$month_arr=array("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec");

	$month_arr_temp=array("J","K","L","A","B","C","D","E","F","G","H","I");

	$curre_month=date("M",$temp_date2);

	for($gh=0;$gh<count($month_arr);$gh++)

	{

		if($month_arr[$gh]==$curre_month)

		{

			$temp_string=$month_arr_temp[$gh];

		}

	}

	$temp_explode="";

	if($invoice_type1=="Tax Invoice")

	{

		$select_order=mysqli_query($con,"select recent_sequence from `tbl_sequence` where distributor_id='$dis_id'");

		$select_row =  mysqli_fetch_assoc($select_order);

		if(mysqli_num_rows($select_order)>0)

		{

			$temp=$select_row['recent_sequence'];

			$check_seq=mysqli_query($con,"select bill_sequence from `tbl_distributor` where distributor_id='$dis_id'");

			$select_seq =  mysqli_fetch_assoc($check_seq);

			if($select_seq['bill_sequence']=="Standard")

			{

				if($temp_string==$temp[0])

				{

					$final_invoice=(int)substr($temp,1);

					$final_invoice=$final_invoice+1;

					$final_invoice1=(string)$final_invoice;

					$string_count=5-(int)strlen($final_invoice1);

					for($vb=0;$vb<$string_count;$vb++)

					{

						$temp_explode=$temp_explode."0";

					}

					$sd=$temp_string.$temp_explode.$final_invoice;

				}

				else

				{

					$sd=$temp_string."00001";

				}

			}

			else

			{

				$temp_explode=substr($temp,0,2);

				$final_invoice=(int)substr($temp,2);

				$final_invoice=$final_invoice+1;

				$sd=$temp_explode.$final_invoice;

			}

			$uq_sequence=mysqli_query($con,"UPDATE tbl_sequence SET recent_sequence='$sd',last_update_datetime='$scri' where distributor_id='$dis_id'");

		}

		else

		{

			$sd=$temp_string."00001";

			$uq_sequence =mysqli_query($con,"insert into tbl_sequence(distributor_id,recent_sequence,last_update_datetime)values('$dis_id','$sd','$scri')");

		}	

	}

	else

	{

		$select_order=mysqli_query($con,"select challan_sequence from `tbl_sequence` where distributor_id='$dis_id'");

		$select_row =  mysqli_fetch_assoc($select_order);

		if(mysqli_num_rows($select_order)>0)

		{

			$temp=$select_row['challan_sequence'];

			if($temp_string==$temp[0])

			{

				$final_invoice=(int)substr($temp,2);

				$final_invoice=$final_invoice+1;

				$final_invoice1=(string)$final_invoice;

				$string_count=5-(int)strlen($final_invoice1);

				for($vb=0;$vb<$string_count;$vb++)

				{

					$temp_explode=$temp_explode."0";

				}

				$sd=$temp_string."C".$temp_explode.$final_invoice;

			}

			else

			{

				$sd=$temp_string."C00001";

			}

			$uq_sequence=mysqli_query($con,"UPDATE tbl_sequence SET challan_sequence='$sd',last_update_datetime='$scri' where distributor_id='$dis_id'");

		}

		else

		{

			$sd=$temp_string."C00001";

			$uq_sequence =mysqli_query($con,"insert into tbl_sequence(distributor_id,challan_sequence,last_update_datetime)values('$dis_id','$sd','$scri')");

		}	

	}

	if($uq_sequence)

	{

		$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);

		$query ="insert into tbl_party_transaction(transaction_id,transaction_date,transaction_time, transaction_bill_number, transaction_from, transaction_to, total_amount, payment_mode,payment_status,bank_name,cheque_no,cash_amount,cheque_amount,remark,cheque_date,disc_amt,final_amt,bill_type,cess_amount,round_off_amt,serial_no_bill,bill_date,latitude,longitude,courier_facility,courier_no,reference_no,courier_date,courier_company,message_txn_id,consignee_name,transport_company,g_r_no,transport_date,transport_address,tds_amt,party_gstin,labour_charges,freight_charges,other_expenses,generated_by,sign_image,source,credit_days)values('$transaction_id','$da','$scro','$sd','$client1','$p_client','$amount','$pmode','$pstatus','$bank_name','$cheque_no','$cash_amt','$cheque_amt','$remark','$cheque_date','$disc_amt','$final_amt','$invoice_type1','$cess_amt','$round_off_amt','$serial_bill','$da','$latitude','$longitude','$courier_facility','$courier_no','$reference_no','$courier_date','$courier_company','$message_txn_id','$consignee_name','$transport_company','$g_r_no','$transport_date','$transport_address','$tds_amt','$party_gstin','$labouramt','$freightamt','$otherexpamt','','$photoname','Admin','$credit_days')";

		$res = mysqli_query($con,$query);	

		if($res)

		{

			$product_bag_detail=array();

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

					$proprice=$person_a['pro_price'];

					$cgstamt = isset($person_a['cgst_amt']) ? $person_a['cgst_amt'] : '';

					$sgstamt = isset($person_a['sgst_amt']) ? $person_a['sgst_amt'] : '';

					$igstamt = isset($person_a['igstamt']) ? $person_a['igstamt'] : '';

					$dis_type = isset($person_a['discount_type']) ? $person_a['discount_type'] : '';

					$dis_per = isset($person_a['discount_percen']) ? $person_a['discount_percen'] : '';

					$cess_per_amt = isset($person_a['cess_per_amt']) ? $person_a['cess_per_amt'] : '';

					$cess_percentage = isset($person_a['cess_percentage']) ? $person_a['cess_percentage'] : '';

					$cess_final_amt = isset($person_a['cess_final_amt']) ? $person_a['cess_final_amt'] : '';

					$pro_discount = isset($person_a['pro_discount']) ? $person_a['pro_discount'] : '';

					$pro_gst_perc = isset($person_a['gst_perc']) ? $person_a['gst_perc'] : '0';

					$pur_total_amt = isset($person_a['pur_total_amt']) ? $person_a['pur_total_amt'] : '0';

					$pur_taxable_amt = isset($person_a['pur_taxable_amt']) ? $person_a['pur_taxable_amt'] : '0';

					$temp_mrp_val=$person_a['mrp'];

					$toder_batch=$person_a['batch_detail'];

					$adjust_qtyval=$ordquantiy;

					$pro_batch='';

					$pro_expirydate='';

					$pro_packing='';

					$pro_batchqty='';

					$uniq_ik=0;

					$temp_batch=json_decode($toder_batch, true);   

					foreach($temp_batch as $selected)

					{

						if($uniq_ik==0)

						{

							if($adjust_qtyval>0)

							{

								$pbatchqty=$selected['batch_qty'];

								$pro_stocktxnid=$selected['txn_id'];

								$pro_expirydate=$selected['expirydate'];

								$pro_batch=$selected['batch_no'];

								$pro_packing=$selected['packing_detail'];

								if($adjust_qtyval>$pbatchqty)

								{

									$pro_batchqty=$pbatchqty;

									$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET batch_qty_adjust=batch_qty_adjust+'$pbatchqty',update_bill_datetime='$scri' where transaction_id='$pro_stocktxnid' and distributor_id='$dis_id'");

									$adjust_qtyval=$adjust_qtyval-$pbatchqty;

								}

								else

								{

									$pro_batchqty=$adjust_qtyval;

									$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET batch_qty_adjust=batch_qty_adjust+'$adjust_qtyval',update_bill_datetime='$scri' where transaction_id='$pro_stocktxnid' and distributor_id='$dis_id'");

									$adjust_qtyval=0;

								}

							}

						}

						else

						{

							if($adjust_qtyval>0)

							{

								$pro_stocktxnid=$selected['txn_id'];

								$pbatchqty=$selected['batch_qty'];

								$pro_batch=$pro_batch.",".$selected['batch_no'];;

								$pro_expirydate=$pro_expirydate.",".$selected['expirydate'];

								$pro_packing=$pro_packing.",".$selected['packing_detail'];

								if($adjust_qtyval>$pbatchqty)

								{

									$pro_batchqty=$pro_batchqty.",".$selected['batch_qty'];

									$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET batch_qty_adjust=batch_qty_adjust+'$pbatchqty',update_bill_datetime='$scri' where transaction_id='$pro_stocktxnid' and distributor_id='$dis_id'");

									$adjust_qtyval=$adjust_qtyval-$pbatchqty;

								}

								else

								{

									$pro_batchqty=$pro_batchqty.",".$adjust_qtyval;

									$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET batch_qty_adjust=batch_qty_adjust+'$adjust_qtyval',update_bill_datetime='$scri' where transaction_id='$pro_stocktxnid' and distributor_id='$dis_id'");

									$adjust_qtyval=0;

								}

							}

						}

						$uniq_ik++;

					}	

					$product_bag_detail['product_id']=$prodid;

					$product_bag_detail['batch_no']=$pro_batch;

					$product_bag_detail['expiry_date']=$pro_expirydate;

					$product_bag_detail['packing']=$pro_packing;

					$response['product_bag_detail'][]=$product_bag_detail;

					$query2=mysqli_query($con,"insert into tbl_party_transaction_detail(transaction_id,product_id, product_name, quantity,CGST_amount,SGST_amount,product_price,discount_type,discount_percentage,cess_pc_amt,cess_percentage,cess_final_amt,product_disc,IMEI_NO,IGST_amount,actual_quantity,gst_perc,product_total_amt,taxable_amount,batch_no,expiry_date,adjust_stock,packing,MRP)values('$re','$prodid','$prodname','$ordquantiy','$cgstamt','$sgstamt','$proprice','$dis_type','$dis_per','$cess_per_amt','$cess_percentage','$cess_final_amt','$pro_discount','$pro_imei_no','$igstamt','$pro_actual_qty','$pro_gst_perc','$pur_total_amt','$pur_taxable_amt','$pro_batch','$pro_expirydate','$pro_batchqty','$pro_packing','$temp_mrp_val')");



					$res_stock = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date ='$da' and distributor_id='$dis_id' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");

					if(mysqli_num_rows($res_stock)>0)

					{

						$row_stock =  mysqli_fetch_assoc($res_stock);

						$stock_quantity=$row_stock['closing_stock'];

						$temp_quantity=round($stock_quantity-$ordquantiy,2);

						$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scro' where date ='$da' and distributor_id='$dis_id' and product_id='$prodid'");

						$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$dis_id'");

					}

					else

					{

						$res_stock1 = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date <='$da' and distributor_id='$dis_id' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");

						if(mysqli_num_rows($res_stock1)>0)

						{

							$row_stock1 =  mysqli_fetch_assoc($res_stock1);

							$stock_quantity=$row_stock1['closing_stock'];

							$temp_quantity=round($stock_quantity-$ordquantiy,2);

							$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$dis_id','$prodid','$stock_quantity','$temp_quantity','$da','$scro')");

							$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$dis_id'");

						}

					}

				} 

			}  

			$response['success']=1;

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

	$response['details']="Required Field Missing...!!";

}		

echo json_encode($response);

?> 