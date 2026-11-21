<?php
include("../../connect.php");
$response = array();
if(isset($_POST['cdate']) && isset($_POST['distributor_id']) && isset($_POST['user_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	
	$cdate = $_POST['cdate'];
	$temp_user_id = $_POST['user_id'];
	
	$res_user = mysqli_query($con,"select * from tbl_user where user_id='$temp_user_id' and distributor_id='$session_dist_ver' and status='Active'");
	while($fetch_user=mysqli_fetch_assoc($res_user))
	{
		$response['temp_user_name']=$fetch_user['user_name'];
		$response['temp_user_phone']=$fetch_user['user_phone'];
		$work_type=$fetch_user['work_type'];
	}
	
	$res_dsr = mysqli_query($con,"select * from tbl_dsr where user_id='$temp_user_id' and date='$cdate' and dsr_status in ('Pending','Accept') and type!='System Generated Entry'");
	if(mysqli_num_rows($res_dsr)<=0)
	{
		$flag=0;
	}
	else
	{
		$flag=1;
		while($row_dsr=mysqli_fetch_assoc($res_dsr))
		{
			$temp_dsr_final_id=$row_dsr['dsr_id'];
			$dsr_status_final=$row_dsr['dsr_status'];
			$dsr_submit_time=$row_dsr['time'];					
			$dsr_submit_time=date('h:i:sa', strtotime($dsr_submit_time));
		}
	}
	$last_previous_dsr=0;
	$res_dsr_last = mysqli_query($con,"select *  from tbl_dsr where user_id='$temp_user_id' and dsr_status in ('Pending','Accept') and date<'$cdate' and type!='System Generated Entry' order by dsr_id desc limit 1");
	while($row_dsr_last=mysqli_fetch_assoc($res_dsr_last))
	{
		$last_previous_dsr=$row_dsr_last['date'];
		$r_date=strtotime($last_previous_dsr);
		$r2_date= strtotime("+1 day", $r_date);
		$d2_date=trim(date('Y-m-d', $r2_date));
	}
	if($last_previous_dsr==0)
	{
		$res_dsr_last=mysqli_query($con,"SELECT * FROM tbl_party_transaction where transaction_from='$temp_user_id' and txn_id='' and payment_status!='Converted' and source not in ('Web','Admin') order by id  ASC limit 1");
		while($row_dsr_last=mysqli_fetch_assoc($res_dsr_last))
		{
			$d2_date=$row_dsr_last['transaction_date'];
			$r_date=strtotime($d2_date);
			$r2_date= strtotime("-1 day", $r_date);
			$last_previous_dsr=trim(date('Y-m-d', $r2_date));
		}
	}
	$response['start_date']=date("d-M-Y", strtotime($d2_date));
	$response['end_date']=date("d-M-Y", strtotime($cdate));
	if($flag==1)
	{
		$dsr_txn_detail = array();
		$temp_tamt=$actualGrandamt=$tempCollectionAmt=$ftempCollectionAmt=$actualamt=$temp_camt=$temp_rcamt=$temp_rchamt=$temp_chamt=$temp_credit=$temp_amt=$temp_online=$temp_ronamt=0;
		$res=mysqli_query($con,"SELECT * FROM tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_from='$temp_user_id' and tbl_party_transaction.transaction_date>'$last_previous_dsr' and tbl_party_transaction.transaction_date<='$cdate' and txn_id='' and tbl_party_transaction.converted_transaction_id='' and tbl_party_transaction.source not in ('Web','Admin')");
		if(mysqli_num_rows($res)>0)
		{     
			while($fetch_product2=mysqli_fetch_assoc($res))
			{
				extract($fetch_product2);
				$temp_transaction=$transaction_id;
				if($payment_mode=="Credit")
				{
					$temp_credit=$temp_credit+$final_amt;
				}
				else if($payment_mode=="Cheque")
				{
					$temp_chamt=$temp_chamt+$final_amt;
					$temp_amt=$temp_amt+$final_amt;
				}
				else if($payment_mode=="Cash")
				{
					$temp_camt=$temp_camt+$final_amt;
					$temp_amt=$temp_amt+$final_amt;
				}
				else if($payment_mode=="Both")
				{
					$temp_camt=$temp_camt+$cash_amount;
					$temp_amt=$temp_amt+$final_amt;
					$temp_chamt=$temp_chamt+$cheque_amount;
				}
				else
				{
					$temp_amt=$temp_amt+$final_amt;
					$temp_online=$temp_online+$cheque_amount;
				}
				$actualGrandamt=$actualGrandamt+round($fetch_product2['final_amt'],2);
				$dsr_txn_detail['party_name']=$party_name.' - '.$party_phone;
				$dsr_txn_detail['bill_no']=$transaction_bill_number;
				$dsr_txn_detail['type']='Bill';
				$dsr_txn_detail['bill_date']=$fetch_product2['transaction_date'];
				$dsr_txn_detail['total_amount']=$fetch_product2['total_amount'];
				$dsr_txn_detail['discount_on_total']=$fetch_product2['disc_amt']+$fetch_product2['discount_on_total'];
				$dsr_txn_detail['final_amt']=$fetch_product2['final_amt'];
				$dsr_txn_detail['payment_mode']=$fetch_product2['payment_mode'];
				$dsr_txn_detail['cash_amount']=$fetch_product2['cash_amount'];
				$dsr_txn_detail['cheque_amount']=$fetch_product2['cheque_amount'];
				if($fetch_product2['bank_id']>0) { 
					$bank_matser_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_master WHERE distributor_id='$session_dist_ver' and bank_master_id='".$fetch_product2['bank_id']."'");
					if(mysqli_num_rows($bank_matser_detail)>0)
					{     
						$fetch_product=mysqli_fetch_array($bank_matser_detail);
						$dsr_txn_detail['bank_detail']=$fetch_product['bank_name'];
					}
				} 
				else
				{
					$dsr_txn_detail['bank_detail']='';
				}
				$response['dsr_txn_detail'][]=$dsr_txn_detail;
			}
		}
		$res11=mysqli_query($con,"SELECT tbl_party_transaction.transaction_id,tbl_receipt_transaction.txn_receipt_id, tbl_receipt_transaction.receipt_date,tbl_party_transaction.transaction_to,tbl_receipt_transaction.total_amount,tbl_receipt_transaction.cash_amount,tbl_receipt_transaction.cheque_amount,tbl_receipt_transaction.payment_mode,tbl_receipt_transaction.adjust_amount,tbl_party_transaction.transaction_date,tbl_party.party_name,tbl_party.party_phone,tbl_receipt_transaction.bank_id,tbl_receipt_transaction.receipt_disc_amt,tbl_party_transaction.source FROM tbl_receipt_transaction,tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_party_transaction.transaction_id = tbl_receipt_transaction.transaction_id and tbl_receipt_transaction.receipt_date>'$last_previous_dsr' and tbl_receipt_transaction.receipt_date<='$cdate' and tbl_receipt_transaction.generated_user_id='$temp_user_id' and tbl_receipt_transaction.source not in ('Web','Admin') and tbl_receipt_transaction.payment_mode not in ('Adjust Advance Payment','Adjust Credit Note')");
		if(mysqli_num_rows($res11)>0)
		{     
			while($fetch_product21=mysqli_fetch_assoc($res11))
			{
				extract($fetch_product21);
				if($fetch_product21['transaction_date']==$cdate && $fetch_product21['source']=='')
					$ftempCollectionAmt=$ftempCollectionAmt+$fetch_product21['total_amount'];
				else
					$tempCollectionAmt=$tempCollectionAmt+$fetch_product21['total_amount'];
				if($fetch_product21['payment_mode']=='Cash')
					$temp_rcamt=$temp_rcamt+$fetch_product21['cash_amount'];
				else if($fetch_product21['payment_mode']=='Cheque')
					$temp_rchamt=$temp_rchamt+$fetch_product21['cheque_amount'];
				else if($fetch_product21['payment_mode']=='Both')
				{
					$temp_rchamt=$temp_rchamt+$fetch_product21['cheque_amount'];
					$temp_rcamt=$temp_rcamt+$fetch_product21['cash_amount'];
				}
				else if($fetch_product21['payment_mode']=='Online' || $fetch_product21['payment_mode']=='Wallet')
					$temp_ronamt=$temp_ronamt+$fetch_product21['cheque_amount'];
		
				$dsr_txn_detail['party_name']=$party_name.' - '.$party_phone;
				$dsr_txn_detail['bill_no']=$fetch_product21['txn_receipt_id'];
				$dsr_txn_detail['type']='Credit-Cash Receipt';
				$dsr_txn_detail['bill_date']=$fetch_product21['receipt_date'];
				$dsr_txn_detail['total_amount']=$fetch_product21['total_amount'];
				$dsr_txn_detail['discount_on_total']=$fetch_product21['receipt_disc_amt'];
				$dsr_txn_detail['final_amt']=$fetch_product21['total_amount'];
				$dsr_txn_detail['payment_mode']=$fetch_product21['payment_mode'];
				$dsr_txn_detail['cash_amount']=$fetch_product21['cash_amount'];
				$dsr_txn_detail['cheque_amount']=$fetch_product21['cheque_amount'];
				if($fetch_product21['bank_id']>0) { 
					$bank_matser_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_master WHERE distributor_id='$session_dist_ver' and bank_master_id='".$fetch_product21['bank_id']."'");
					if(mysqli_num_rows($bank_matser_detail)>0)
					{     
						$fetch_product=mysqli_fetch_array($bank_matser_detail);
						$dsr_txn_detail['bank_detail']=$fetch_product['bank_name'];
					}
				} 
				else
				{
					$dsr_txn_detail['bank_detail']='';
				}
				$response['dsr_txn_detail'][]=$dsr_txn_detail;
			}
		}
		$res15=mysqli_query($con,"SELECT * FROM tbl_other_receipt_txn,tbl_party where tbl_other_receipt_txn.party_id=tbl_party.party_id and tbl_other_receipt_txn.user_id='$temp_user_id' and tbl_other_receipt_txn.receipt_date>'$last_previous_dsr' and tbl_other_receipt_txn.receipt_date<='$cdate' and tbl_other_receipt_txn.status='Complete' and tbl_other_receipt_txn.source not in ('Web','Admin')");
		if(mysqli_num_rows($res15)>0)
		{     
			while($fetch_product51=mysqli_fetch_assoc($res15))
			{
				extract($fetch_product51);
				$tempCollectionAmt=$tempCollectionAmt+$fetch_product51['total_amount'];
				if($fetch_product51['payment_mode']=='Cash')
					$temp_rcamt=$temp_rcamt+$fetch_product51['cash_amount'];
				else if($fetch_product51['payment_mode']=='Cheque')
					$temp_rchamt=$temp_rchamt+$fetch_product51['cheque_amount'];
				else if($fetch_product51['payment_mode']=='Both')
				{
					$temp_rchamt=$temp_rchamt+$fetch_product51['cheque_amount'];
					$temp_rcamt=$temp_rcamt+$fetch_product51['cash_amount'];
				}
				else if($fetch_product51['payment_mode']=='Online' || $fetch_product51['payment_mode']=='Wallet')
					$temp_ronamt=$temp_ronamt+$fetch_product51['cheque_amount'];
				
				$dsr_txn_detail['party_name']=$party_name.' - '.$party_phone;
				$dsr_txn_detail['bill_no']=$user_receipt_id;
				$dsr_txn_detail['type']=$receipt_type;
				$dsr_txn_detail['bill_date']=$fetch_product51['receipt_date'];
				$dsr_txn_detail['total_amount']=$fetch_product51['total_amount'];
				$dsr_txn_detail['discount_on_total']=$fetch_product51['receipt_disc_amt'];
				$dsr_txn_detail['final_amt']=$fetch_product51['total_amount'];
				$dsr_txn_detail['payment_mode']=$fetch_product51['payment_mode'];
				$dsr_txn_detail['cash_amount']=$fetch_product51['cash_amount'];
				$dsr_txn_detail['cheque_amount']=$fetch_product51['cheque_amount'];
				if($fetch_product51['bank_id']>0) { 
					$bank_matser_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_master WHERE distributor_id='$session_dist_ver' and bank_master_id='".$fetch_product51['bank_id']."'");
					if(mysqli_num_rows($bank_matser_detail)>0)
					{     
						$fetch_product=mysqli_fetch_array($bank_matser_detail);
						$dsr_txn_detail['bank_detail']=$fetch_product['bank_name'];
					}
				} 
				else
				{
					$dsr_txn_detail['bank_detail']='';
				}
				$response['dsr_txn_detail'][]=$dsr_txn_detail;
			}
		}
		
		$res16=mysqli_query($con,"SELECT * FROM tbl_receipt_transaction,tbl_party where tbl_receipt_transaction.party_id = tbl_party.party_id and tbl_receipt_transaction.generated_user_id='$temp_user_id' and tbl_receipt_transaction.receipt_date>'$last_previous_dsr' and tbl_receipt_transaction.receipt_date<='$cdate' and tbl_receipt_transaction.status='Complete' and tbl_receipt_transaction.source not in ('Web','Admin')");
		if(mysqli_num_rows($res16)>0)
		{     
			while($fetch_product21=mysqli_fetch_assoc($res16))
			{
				extract($fetch_product21);
				$tempCollectionAmt=$tempCollectionAmt+$fetch_product21['total_amount'];
				if($fetch_product21['payment_mode']=='Cash')
					$temp_rcamt=$temp_rcamt+$fetch_product21['cash_amount'];
				else if($fetch_product21['payment_mode']=='Cheque')
					$temp_rchamt=$temp_rchamt+$fetch_product21['cheque_amount'];
				else if($fetch_product21['payment_mode']=='Both')
				{
					$temp_rchamt=$temp_rchamt+$fetch_product21['cheque_amount'];
					$temp_rcamt=$temp_rcamt+$fetch_product21['cash_amount'];
				}
				else if($fetch_product21['payment_mode']=='Online' || $fetch_product21['payment_mode']=='Wallet')
					$temp_ronamt=$temp_ronamt+$fetch_product21['cheque_amount'];
		
				$dsr_txn_detail['party_name']=$party_name.' - '.$party_phone;
				$dsr_txn_detail['bill_no']=$txn_receipt_id;
				$dsr_txn_detail['type']='Outstanding';
				$dsr_txn_detail['bill_date']=$fetch_product21['receipt_date'];
				$dsr_txn_detail['total_amount']=$fetch_product21['total_amount'];
				$dsr_txn_detail['discount_on_total']='';
				$dsr_txn_detail['final_amt']=$fetch_product21['total_amount'];
				$dsr_txn_detail['payment_mode']=$fetch_product21['payment_mode'];
				$dsr_txn_detail['cash_amount']=$fetch_product21['cash_amount'];
				$dsr_txn_detail['cheque_amount']=$fetch_product21['cheque_amount'];
				if($fetch_product21['bank_id']>0) { 
					$bank_matser_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_master WHERE distributor_id='$session_dist_ver' and bank_master_id='".$fetch_product21['bank_id']."'");
					if(mysqli_num_rows($bank_matser_detail)>0)
					{     
						$fetch_product=mysqli_fetch_array($bank_matser_detail);
						$dsr_txn_detail['bank_detail']=$fetch_product['bank_name'];
					}
				} 
				else
				{
					$dsr_txn_detail['bank_detail']='';
				}
				$response['dsr_txn_detail'][]=$dsr_txn_detail;
			}
		}
		
		$dsr_final_detail = array();
		$dsr_final_detail['type']='Total Cash/Cheque against Sale';
		$dsr_final_detail['final_amt']=$actualGrandamt;
		$dsr_final_detail['cash_amount']=$temp_camt;
		$dsr_final_detail['cheque_amount']=$temp_chamt;
		$dsr_final_detail['credit_amt']='';
		$dsr_final_detail['online_amt']=$temp_online;
		$response['dsr_final_detail'][]=$dsr_final_detail;
		
		$dsr_final_detail['type']='Total Cash/Cheque against receipt/other';
		$dsr_final_detail['final_amt']='';
		$dsr_final_detail['cash_amount']=$temp_rcamt;
		$dsr_final_detail['cheque_amount']=$temp_rchamt;
		$dsr_final_detail['credit_amt']='';
		$dsr_final_detail['online_amt']=$temp_ronamt;
		$response['dsr_final_detail'][]=$dsr_final_detail;
		
		$dsr_final_detail['type']='Total Grand Amount';
		$dsr_final_detail['final_amt']=$temp_amt+$temp_credit+$tempCollectionAmt;
		$dsr_final_detail['cash_amount']=$temp_camt+$temp_rcamt;
		$dsr_final_detail['cheque_amount']=$temp_chamt+$temp_rchamt;
		$dsr_final_detail['credit_amt']=$temp_credit-$ftempCollectionAmt;
		$dsr_final_detail['online_amt']=$temp_online+$temp_ronamt;
		$response['dsr_final_detail'][]=$dsr_final_detail;
		
		$dsr_stock_detail = array();
		$type_explode=explode('+',$work_type);
		$type_array='';
		for($i=0;$i<sizeof($type_explode);$i++)
		{
			if($type_explode[$i]!='')
			{
				if($i==0)
					$type_array="'".$type_explode[$i]."'";
				else
					$type_array=$type_array.",'".$type_explode[$i]."'";
			}
		}
		$select_product1 = mysqli_query($con,"select * from tbl_product where status='Active' and distributor_id='$session_dist_ver' and product_type in ($type_array)");
		$tamt_opening=$tamt_stockin=$tamt_stockout=$tamt_closing=0;						
		while($fetch_product1=mysqli_fetch_array($select_product1))
		{
			$product_id=$fetch_product1['product_id'];
			$product_name=$fetch_product1['product_name'];
			$product_price=$fetch_product1['product_price'];
			$show_flag=0;
			$product_detail=mysqli_query($con,"SELECT * FROM tbl_user_stock where date<='$cdate' and user_id='$temp_user_id' and product_id='$product_id' order by date DESC limit 1");
			if(mysqli_num_rows($product_detail)>0)
			{     
				while($fetch_detail=mysqli_fetch_array($product_detail))
				{
					$closing_stock=round($fetch_detail['quantity'],2);
					if($closing_stock>0)
						$show_flag=1;
					$product_opening=mysqli_query($con,"SELECT * FROM tbl_user_stock where date<='$last_previous_dsr' and user_id='$temp_user_id' and product_id='$product_id' order by date DESC limit 1");
					while($fetch_detail_opening=mysqli_fetch_array($product_opening))
					{
						$opening_stock=round($fetch_detail_opening['quantity'],2);
						if($opening_stock>0)
							$show_flag=1;
					}
																
					$stockin_detail=mysqli_query($con,"SELECT * FROM tbl_user_request,tbl_user_request_detail where tbl_user_request.transaction_id=tbl_user_request_detail.transaction_id and tbl_user_request.complete_date>'$last_previous_dsr' and tbl_user_request.complete_date<='$cdate' and tbl_user_request.user_id='$temp_user_id' and tbl_user_request_detail.product_id='$product_id' and tbl_user_request.status='Complete'");
					$temp_stockin=0;
					if(mysqli_num_rows($stockin_detail)>0)
					{   
						$show_flag=1;
						while($fetch_stockin=mysqli_fetch_array($stockin_detail))
						{
							$temp_stockin=$temp_stockin+$fetch_stockin['quantity'];
						}
						$stock_in=$temp_stockin;
					}
					else
					{
						$stock_in=$temp_stockin;
					}
															
					$stockout_detail=mysqli_query($con,"SELECT * FROM tbl_party_transaction,tbl_party_transaction_detail where tbl_party_transaction.transaction_id=tbl_party_transaction_detail.transaction_id and tbl_party_transaction.transaction_date>'$last_previous_dsr' and tbl_party_transaction.transaction_date<='$cdate' and tbl_party_transaction.transaction_from='$temp_user_id' and tbl_party_transaction_detail.product_id='$product_id' and tbl_party_transaction.converted_transaction_id='' and tbl_party_transaction.source not in ('Web','Admin')");
					$temp_stockout=0;
					if(mysqli_num_rows($stockout_detail)>0)
					{     
						$show_flag=1;
						while($fetch_stockout=mysqli_fetch_array($stockout_detail))
						{
							$temp_stockout=$temp_stockout+$fetch_stockout['quantity'];
						}
						$stock_out=$temp_stockout;
					}
					else
					{
						$stock_out=$temp_stockout;
					}

					$stockreturn_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_transaction where distributor_id='$session_dist_ver' and transaction_date>'$last_previous_dsr' and transaction_date<='$cdate' and user_id='$temp_user_id' and product_id='$product_id' and txn_type='Return'");
					$temp_stockreturn=0;
					if(mysqli_num_rows($stockreturn_detail)>0)
					{    
						$show_flag=1;
						while($fetch_stockreturn=mysqli_fetch_array($stockreturn_detail))
						{
							$temp_stockreturn=$temp_stockreturn+$fetch_stockreturn['quantity'];
						}
						$stock_return=$temp_stockreturn;
					}
					else
					{
						$stock_return=$temp_stockreturn;
					}
				} 
			}
			if($show_flag==1) 
			{
				$dsr_stock_detail['product_name']=$product_name;
				$dsr_stock_detail['opening_stock']=$opening_stock;
				$dsr_stock_detail['stock_in']=$stock_in;
				$dsr_stock_detail['stock_out']=$stock_out;
				$dsr_stock_detail['stock_return']=$stock_return;
				$dsr_stock_detail['closing_stock']=$closing_stock;
				$response['dsr_stock_detail'][]=$dsr_stock_detail;
			}
			$opening_stock="";$stock_in="";$stock_out="";$closing_stock="";$stock_return=""; 
		}
		
		
		$dsr_bank_detail = array();
		$final_bank_summary_amt=0;
		$select_client_bank=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_master WHERE distributor_id='$session_dist_ver' and status='Active'");
		if(mysqli_num_rows($select_client_bank)>0)
		{
			while($fetch_cash_amt=mysqli_fetch_array($select_client_bank))
			{
				$bank_collect_amt=0;
				$bankmaster_id=$fetch_cash_amt['bank_master_id'];
				$bankmaster_name=$fetch_cash_amt['bank_name'];
				$res_bank=mysqli_query($con,"SELECT * FROM tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_party_transaction.transaction_from='$temp_user_id' and tbl_party_transaction.transaction_date>'$last_previous_dsr' and tbl_party_transaction.transaction_date<='$cdate' and tbl_party_transaction.txn_id='' and tbl_party_transaction.converted_transaction_id='' and tbl_party_transaction.source not in ('Web','Admin') and tbl_party_transaction.bank_id='$bankmaster_id'");
				if(mysqli_num_rows($res_bank)>0)
				{     
					while($fetch_product2=mysqli_fetch_assoc($res_bank))
					{
						if($fetch_product2['payment_mode']=="Online" || $fetch_product2['payment_mode']=="Wallet")
						{
							$bank_collect_amt=$bank_collect_amt+$fetch_product2['final_amt'];
						}
					}
				}
				$res_bank11=mysqli_query($con,"SELECT cheque_amount,payment_mode FROM tbl_receipt_transaction where receipt_date>'$last_previous_dsr' and receipt_date<='$cdate' and generated_user_id='$temp_user_id' and source not in ('Web','Admin') and payment_mode not in ('Adjust Advance Payment','Adjust Credit Note') and bank_id='$bankmaster_id'");
				if(mysqli_num_rows($res_bank11)>0)
				{     
					while($fetch_product21=mysqli_fetch_assoc($res_bank11))
					{
						if($fetch_product21['payment_mode']=="Online" || $fetch_product21['payment_mode']=="Wallet")
						{
							$bank_collect_amt=$bank_collect_amt+$fetch_product21['cheque_amount'];
						}
					}
				}
													
				$res_bank15=mysqli_query($con,"SELECT * FROM tbl_other_receipt_txn where user_id='$temp_user_id' and receipt_date>'$last_previous_dsr' and receipt_date<='$cdate' and status='Complete' and bank_id='$bankmaster_id' and source not in ('Web','Admin')");
				if(mysqli_num_rows($res_bank15)>0)
				{     
					while($fetch_product51=mysqli_fetch_assoc($res_bank15))
					{
						if($fetch_product51['payment_mode']=="Online" || $fetch_product51['payment_mode']=="Wallet")
						{
							$bank_collect_amt=$bank_collect_amt+$fetch_product51['cheque_amount'];
						}
					}
				}
				$final_bank_summary_amt=$final_bank_summary_amt+$bank_collect_amt;
				
				$dsr_bank_detail['bank_name']=$bankmaster_name;
				$dsr_bank_detail['bank_collect_amt']=$bank_collect_amt;
				$response['dsr_bank_detail'][]=$dsr_bank_detail;
			}
			$dsr_bank_detail['bank_name']='Total Bank Collection Amount';
			$dsr_bank_detail['bank_collect_amt']=$final_bank_summary_amt;
			$response['dsr_bank_detail'][]=$dsr_bank_detail;
		}
		else
		{
			$response['dsr_bank_detail']=$dsr_bank_detail;
		}
		
		
		
		
		$dsr_final_collection_detail = array();											
		$select_dsr_collection=mysqli_query($con,"SELECT * FROM tbl_dsr where user_id='$temp_user_id' and tb_insertdate='$cdate' and dsr_status!='Reject'");
		while($fetch_dsr_collection=mysqli_fetch_array($select_dsr_collection))
		{
			$mydsrid=$fetch_dsr_collection['dsr_id'];
			$mydsrdate=$fetch_dsr_collection['date'];	
			if($mydsrdate==$cdate) 
			{
				$dsr_final_collection_detail['type']='Today Money Collection';
				
			}
			else
			{
				$dsr_final_collection_detail['type']='Previous Money Collection';
			}
			$dsr_final_collection_detail['collection_date']=$mydsrdate;
			$dsr_final_collection_detail['cheque_detail']=$fetch_dsr_collection['cheque_detail'];
			$dsr_final_collection_detail['online_amt']=$fetch_dsr_collection['online_amt'];
			
			$dsr_final_collection_detail['dsr_collection_detail'] = array();
			$select_cash=mysqli_query($con,"SELECT * FROM tbl_denomination where status='Active' order by denomination_title DESC");
			$tamt_total=$temp_demom_name=0;
			while($fetch_cash=mysqli_fetch_array($select_cash))
			{
				$denom_id=$fetch_cash['denomination_id'];
				$denom_title=(int)$fetch_cash['denomination_title'];
											
				$user_cash_detail=mysqli_query($con,"SELECT * FROM tbl_dsr,tbl_dsr_cashDetail where tbl_dsr.dsr_id = tbl_dsr_cashDetail.dsr_id and tbl_dsr_cashDetail.denomination_id='$denom_id' and tbl_dsr.dsr_status in ('Pending','Accept') and tbl_dsr.dsr_id='$mydsrid'");
				if(mysqli_num_rows($user_cash_detail)>0)
				{     
					while($fetch_user_cash_detail=mysqli_fetch_array($user_cash_detail))
					{
						$tamt_total=$tamt_total+($fetch_user_cash_detail['total_count']*$denom_title);
						$temp_demom_name=$temp_demom_name+(int)$fetch_user_cash_detail['total_count'];
					}
				}	
				if($temp_demom_name!=0)	
				{
					$dsr_collection_detail['title']=$denom_title;
					$dsr_collection_detail['title_count']=$temp_demom_name;
					$dsr_collection_detail['final_amount']=$denom_title*$temp_demom_name;
					$dsr_final_collection_detail['dsr_collection_detail'][]=$dsr_collection_detail;
					$temp_demom_name=0;
				}	
			}
			$dsr_collection_detail['title']='Grand_total';
			$dsr_collection_detail['title_count']='';
			$dsr_collection_detail['final_amount']=$tamt_total;
			$dsr_final_collection_detail['dsr_collection_detail'][]=$dsr_collection_detail;
			$response['dsr_final_collection_detail'][]=$dsr_final_collection_detail;
		}
		
		
		
		$select_cash_deduction=mysqli_query($con,"SELECT * FROM tbl_dsr where dsr_status='Accept' and type='System Generated Entry' and date>='$d2_date' and date<='$cdate' and user_id='$temp_user_id'");
		if(mysqli_num_rows($select_cash_deduction)>0)
		{
			$cancel_cash_amt=$cancel_cheque_amt=0;
			while($fetch_cash_amt=mysqli_fetch_array($select_cash_deduction))
			{
				$cancel_cash_amt=$cancel_cash_amt+$fetch_cash_amt['cash_detail'];
				$cancel_cheque_amt=$cancel_cheque_amt+$fetch_cash_amt['cheque_detail'];
			}
			$response['money_deduction']='(By Invoice / Receipt Cancellation)';
			$response['money_deduction_date']=date("d-M-Y", strtotime($mydsrdate));
			$response['money_deduction_cash']=$cancel_cash_amt;
			$response['money_deduction_checque']=$cancel_cheque_amt;
		}
		$select_dsr_amt_deduction=mysqli_query($con,"SELECT amount FROM tbl_dsr_bill_edit_adjustment where bill_date>='$d2_date' and bill_date<='$cdate' and fse_id='$temp_user_id'");
		if(mysqli_num_rows($select_dsr_amt_deduction)>0)
		{
			$cancel_total_amt=0;
			while($fetch_cash_amt=mysqli_fetch_array($select_dsr_amt_deduction))
			{
				$cancel_total_amt=$cancel_total_amt+$fetch_cash_amt['amount'];
			}	
			$response['money_deduction_edit']='(By Invoice Edit)';
			$response['money_deduction_editdate']=date("d-M-Y", strtotime($mydsrdate));
			$response['money_deduction_edit_amount']=$cancel_total_amt;
		}
		$response['success']='1';
		$response['details']="DSR Submitted Successfully!";		
	}
	else
	{
		$response['success']='0';
		$response['details']="DSR Not Submitted Yet!";
	}
	
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>